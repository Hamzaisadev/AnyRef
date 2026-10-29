# Ephemeral In-Memory Processing for Product Photos

Product photos uploaded during the Autofill flow are processed directly in-memory as transient request streams and discarded immediately after AI feature extraction, rather than saved to Supabase Storage. Storing temporary images would require managing short-lived private buckets, tracking cleanup metadata, and running scheduled deletion cron jobs. Stream processing eliminates orphan asset accumulation, guarantees data privacy, and lowers operational overhead without impacting prompt quality.
