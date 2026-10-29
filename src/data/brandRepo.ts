import { createClient } from '../lib/supabaseServer';
import type { Brand, CreateBrandInput, UpdateBrandInput } from '../domain/brand';

export interface BrandRepo {
  create(userId: string, input: CreateBrandInput): Promise<Brand>;
  findById(userId: string, brandId: string): Promise<Brand | null>;
  findAllByUserId(userId: string): Promise<Brand[]>;
  update(userId: string, brandId: string, input: UpdateBrandInput): Promise<Brand | null>;
  delete(userId: string, brandId: string): Promise<boolean>;
}

export class SupabaseBrandRepo implements BrandRepo {
  constructor(private getClient: () => Promise<any> | any = createClient) {}

  async create(userId: string, input: CreateBrandInput): Promise<Brand> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('brands')
      .insert({
        ...input,
        user_id: userId,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create brand: ${error?.message}`);
    }

    return data as Brand;
  }

  async findById(userId: string, brandId: string): Promise<Brand | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Brand;
  }

  async findAllByUserId(userId: string): Promise<Brand[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list brands: ${error.message}`);
    }

    return (data || []) as Brand[];
  }

  async update(userId: string, brandId: string, input: UpdateBrandInput): Promise<Brand | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('brands')
      .update(input)
      .eq('id', brandId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Brand;
  }

  async delete(userId: string, brandId: string): Promise<boolean> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', brandId)
      .eq('user_id', userId);

    return !error;
  }
}
