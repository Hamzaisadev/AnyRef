import { createClient } from '../lib/supabaseServer';
import type { Entry, CreateEntryInput, UpdateEntryInput, EntryFilters } from '../domain/entry';

export interface EntryRepo {
  create(userId: string, input: CreateEntryInput): Promise<Entry>;
  findById(userId: string, entryId: string): Promise<Entry | null>;
  findAll(userId: string, filters?: EntryFilters): Promise<Entry[]>;
  update(userId: string, entryId: string, input: UpdateEntryInput): Promise<Entry | null>;
  delete(userId: string, entryId: string): Promise<boolean>;
}

export class SupabaseEntryRepo implements EntryRepo {
  constructor(private getClient: () => Promise<any> | any = createClient) {}

  async create(userId: string, input: CreateEntryInput): Promise<Entry> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('entries')
      .insert({
        ...input,
        user_id: userId,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create entry: ${error?.message}`);
    }

    return data as Entry;
  }

  async findById(userId: string, entryId: string): Promise<Entry | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Entry;
  }

  async findAll(userId: string, filters: EntryFilters = {}): Promise<Entry[]> {
    const supabase = await this.getClient();
    let query = supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId);

    if (filters.brand_id) {
      query = query.eq('brand_id', filters.brand_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.poster_type) {
      query = query.eq('poster_type', filters.poster_type);
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list entries: ${error.message}`);
    }

    return (data || []) as Entry[];
  }

  async update(userId: string, entryId: string, input: UpdateEntryInput): Promise<Entry | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('entries')
      .update(input)
      .eq('id', entryId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Entry;
  }

  async delete(userId: string, entryId: string): Promise<boolean> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    return !error;
  }
}
