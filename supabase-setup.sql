-- نفّذي هذا الملف في Supabase > SQL Editor
-- أنشئي bucket عامًا باسم audio-files من Storage أو اتركي هذا السطر ينشئه.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio-files', 'audio-files', true, 26214400,
        array['audio/mpeg','audio/wav','audio/x-wav','audio/mp4','audio/m4a'])
on conflict (id) do update set public = true, file_size_limit = 26214400;

-- المستخدم المسجل يستطيع إدارة الملفات داخل مجلده فقط.
create policy "Owner can upload own audio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'audio-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Owner can list own audio"
on storage.objects for select to authenticated
using (
  bucket_id = 'audio-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Owner can delete own audio"
on storage.objects for delete to authenticated
using (
  bucket_id = 'audio-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
