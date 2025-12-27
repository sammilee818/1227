// Supabase client initialization
let supabase = null;

function initSupabase() {
    // Get config from config.js (user needs to set SUPABASE_URL and SUPABASE_ANON_KEY)
    if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && 
        typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    }
    return false;
}

// Initialize on load
if (typeof window !== 'undefined' && window.supabase) {
    initSupabase();
}

// API Configuration functions
async function getApiConfig() {
    if (!supabase) {
        if (!initSupabase()) {
            return null;
        }
    }

    try {
        const { data, error } = await supabase
            .from('api_config')
            .select('*')
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching API config:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error getting API config:', error);
        return null;
    }
}

async function saveApiConfig(apiUrl, apiKey, modelName) {
    if (!supabase) {
        if (!initSupabase()) {
            throw new Error('Supabase未初始化，请先配置Supabase URL和Key');
        }
    }

    try {
        // Check if config exists
        const existing = await getApiConfig();

        const configData = {
            api_url: apiUrl,
            api_key: apiKey,
            model_name: modelName,
            updated_at: new Date().toISOString()
        };

        let result;
        if (existing) {
            // Update existing config
            const { data, error } = await supabase
                .from('api_config')
                .update(configData)
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Insert new config
            const { data, error } = await supabase
                .from('api_config')
                .insert(configData)
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        return result;
    } catch (error) {
        console.error('Error saving API config:', error);
        throw error;
    }
}

// Chat messages functions
async function saveMessage(sessionId, role, content) {
    if (!supabase) {
        if (!initSupabase()) {
            throw new Error('Supabase未初始化');
        }
    }

    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                session_id: sessionId,
                role: role,
                content: content,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
}

async function getMessages(sessionId) {
    if (!supabase) {
        if (!initSupabase()) {
            return [];
        }
    }

    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
}

async function createSession(sessionName) {
    if (!supabase) {
        if (!initSupabase()) {
            throw new Error('Supabase未初始化');
        }
    }

    try {
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({
                session_name: sessionName,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
}

async function getSessions() {
    if (!supabase) {
        if (!initSupabase()) {
            return [];
        }
    }

    try {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting sessions:', error);
        return [];
    }
}


