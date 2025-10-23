// src/api/supabaseHelpers.js
import { supabase } from '../supabaseClient';

/* AUTH (we'll use "magic" or email signup later) */
/* For now we'll use profiles table + client-created sessions using Supabase auth if you enable it. */

/* PROFILES */
export async function getProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getProfileByUsername(username) {
  const { data, error } = await supabase.from('profiles').select('*').eq('username', username).limit(1).single();
  if (error) return null;
  return data;
}

export async function createProfile({ username, avatar_url = null, bio = null }) {
  const { data, error } = await supabase.from('profiles').insert([{ username, avatar_url, bio }]).select().single();
  if (error) throw error;
  return data;
}

export async function updateProfile(id, updates) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

/* IMAGE UPLOAD */
export async function uploadToBucket(file, bucket = 'public') {
  const filePath = `${Date.now()}_${file.name}`;
  const { error: uploadErr } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '3600', upsert: false });
  if (uploadErr) throw uploadErr;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/* POSTS (crushies) */
export async function getPosts() {
  const { data, error } = await supabase.from('crushies').select('*, profiles:profiles(user_id,username,avatar_url)').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPost({ user_id, caption, image_url }) {
  const { data, error } = await supabase.from('crushies').insert([{ user_id, caption, image_url }]).select().single();
  if (error) throw error;
  return data;
}

/* MESSAGES */
export async function getMessagesForThread(userA_id, userB_id) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`(sender_id.eq.${userA_id},sender_id.eq.${userB_id})`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // caller should filter by conversation (from/to)
  return data;
}

export async function sendMessage({ sender_id, receiver_id, content }) {
  const { data, error } = await supabase.from('messages').insert([{ sender_id, receiver_id, content }]).select().single();
  if (error) throw error;
  return data;
}

/* REAL-TIME SUBSCRIPTIONS */
export function subscribeMessages(callback) {
  const channel = supabase
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
  return channel;
}

export function subscribeCrushies(callback) {
  const channel = supabase
    .channel('public:crushies')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crushies' }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
  return channel;
}
