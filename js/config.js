// Configuration management
// This file will be configured by the user with Supabase credentials

// User needs to configure these values
const SUPABASE_URL = ''; // User will set this: Project URL from Supabase
const SUPABASE_ANON_KEY = ''; // User will set this: Publishable key from Supabase

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY };
}

