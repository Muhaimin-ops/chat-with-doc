/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gbyvpmmdrqdbtekkmoeq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdieXZwbW1kcnFkYnRla2ttb2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTI5NzgsImV4cCI6MjA3OTYyODk3OH0.td9Uom65i8kRGJdU-4WIiral0FL1AksHdlujZ6EJdQA';

export const supabase = createClient(supabaseUrl, supabaseKey);

/*
  RECOMMENDED SUPABASE DATABASE SCHEMA

  Please run the following SQL in your Supabase SQL Editor to create the necessary tables:

  -- Enable UUID extension
  create extension if not exists "uuid-ossp";

  -- URL Groups Table
  create table if not exists url_groups (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    name text not null,
    created_at timestamptz default now()
  );

  -- Group URLs Table
  create table if not exists group_urls (
    id uuid default uuid_generate_v4() primary key,
    group_id uuid references url_groups on delete cascade not null,
    url text not null,
    created_at timestamptz default now()
  );

  -- Chat Sessions Table
  create table if not exists chat_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    title text,
    created_at timestamptz default now()
  );

  -- Chat Messages Table
  create table if not exists chat_messages (
    id uuid default uuid_generate_v4() primary key,
    session_id uuid references chat_sessions on delete cascade not null,
    sender text not null,
    content text,
    metadata jsonb,
    created_at timestamptz default now()
  );

  -- RLS Policies (Optional but recommended for security)
  alter table url_groups enable row level security;
  create policy "Users can manage their own groups" on url_groups for all using (auth.uid() = user_id);

  alter table group_urls enable row level security;
  create policy "Users can manage their own group urls" on group_urls for all using (
    group_id in (select id from url_groups where user_id = auth.uid())
  );

  alter table chat_sessions enable row level security;
  create policy "Users can manage their own sessions" on chat_sessions for all using (auth.uid() = user_id);

  alter table chat_messages enable row level security;
  create policy "Users can manage their own messages" on chat_messages for all using (
    session_id in (select id from chat_sessions where user_id = auth.uid())
  );
*/
