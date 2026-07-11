import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase 접속 정보는 빌드 시점의 환경변수에서 읽어옵니다.
// anon key는 공개되어도 무방한 값이며(정적 사이트 번들에 포함됨),
// 실제 보안은 Supabase 대시보드의 RLS(행 수준 보안) 정책으로 강제합니다.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// 브라우저용 공개 키. 신규 Supabase 키 체계의 publishable key(sb_publishable_...)를 권장.
// 구버전(legacy) anon 키를 쓰던 경우와의 호환을 위해 VITE_SUPABASE_ANON_KEY 도 폴백으로 허용.
const publishableKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

// 환경변수가 없으면 클라이언트를 만들지 않습니다.
// 이 경우 게임 기록 저장은 조용히 비활성화되고, 게임 플레이에는 영향이 없습니다.
export const supabase: SupabaseClient | null =
  url && publishableKey ? createClient(url, publishableKey) : null;

if (!supabase && import.meta.env.DEV) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY 가 설정되지 않아 게임 기록 저장이 비활성화되었습니다.'
  );
}
