/* eslint-disable */
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    role: 'singer' | 'audience' | 'venue' | 'advertiser' | 'admin'
                    nickname: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    role?: 'singer' | 'audience' | 'venue' | 'advertiser' | 'admin'
                    nickname?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    role?: 'singer' | 'audience' | 'venue' | 'advertiser' | 'admin'
                    nickname?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            singers: {
                Row: {
                    id: string
                    stage_name: string
                    team_id: string | null
                    qr_code_pattern: string | null
                    social_links: Json | null
                    is_verified: boolean
                    fan_count: number
                    created_at: string
                }
                Insert: {
                    id: string
                    stage_name: string
                    team_id?: string | null
                    qr_code_pattern?: string | null
                    social_links?: Json | null
                    is_verified?: boolean
                    fan_count?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    stage_name?: string
                    team_id?: string | null
                    qr_code_pattern?: string | null
                    social_links?: Json | null
                    is_verified?: boolean
                    fan_count?: number
                    created_at?: string
                }
            }
            songs: {
                Row: {
                    id: string
                    singer_id: string
                    title: string
                    artist: string
                    youtube_url: string | null
                    tags: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    singer_id: string
                    title: string
                    artist: string
                    youtube_url?: string | null
                    tags?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    singer_id?: string
                    title?: string
                    artist?: string
                    youtube_url?: string | null
                    tags?: Json | null
                    created_at?: string
                }
            }
            performances: {
                Row: {
                    id: string
                    singer_id: string
                    title: string
                    location_text: string
                    location_lat: number
                    location_lng: number
                    start_time: string
                    end_time: string | null
                    description: string | null
                    chat_enabled: boolean
                    chat_cost_per_hour: number
                    status: 'scheduled' | 'live' | 'ended' | 'cancelled'
                    created_at: string
                }
                Insert: {
                    id?: string
                    singer_id: string
                    title: string
                    location_text: string
                    location_lat: number
                    location_lng: number
                    start_time: string
                    end_time?: string | null
                    description?: string | null
                    chat_enabled?: boolean
                    chat_cost_per_hour?: number
                    status?: 'scheduled' | 'live' | 'ended' | 'cancelled'
                    created_at?: string
                }
                Update: {
                    id?: string
                    singer_id?: string
                    title?: string
                    location_text?: string
                    location_lat?: number
                    location_lng?: number
                    start_time?: string
                    end_time?: string | null
                    description?: string | null
                    chat_enabled?: boolean
                    chat_cost_per_hour?: number
                    status?: 'scheduled' | 'live' | 'ended' | 'cancelled'
                    created_at?: string
                }
            }
            performance_songs: {
                Row: {
                    id: string
                    performance_id: string
                    song_id: string
                    order_index: number
                    status: 'pending' | 'playing' | 'played'
                    is_request: boolean
                }
                Insert: {
                    id?: string
                    performance_id: string
                    song_id: string
                    order_index: number
                    status?: 'pending' | 'playing' | 'played'
                    is_request?: boolean
                }
                Update: {
                    id?: string
                    performance_id?: string
                    song_id?: string
                    order_index?: number
                    status?: 'pending' | 'playing' | 'played'
                    is_request?: boolean
                }
            }
        }
    }
}
