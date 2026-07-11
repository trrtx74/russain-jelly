# Supabase 게임 기록 저장 설정

사람들이 배포된 게임을 플레이하고 게임이 끝날 때마다 결과가 Supabase의 `games` 테이블에 저장됩니다.
정적 사이트(GitHub Pages)에는 서버가 없으므로 **브라우저에서 Supabase로 직접 INSERT** 하는 방식이며,
남용 방지는 Supabase의 **RLS(행 수준 보안)** 로 "삽입만 허용, 조회 불가" 정책을 걸어 처리합니다.

## 1. Supabase 프로젝트 만들기
1. https://supabase.com 에서 로그인 후 **New project** 생성 (무료 플랜으로 충분).
2. 프로젝트가 준비되면 **Project Settings → API Keys** 로 이동.
3. 다음 두 값을 복사:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Publishable key** (`sb_publishable_...`) → `VITE_SUPABASE_PUBLISHABLE_KEY`

> **키 체계 참고:** Supabase가 키 체계를 개편해 예전 **anon** 키는 이제 legacy(구버전)로 분류됩니다.
> 브라우저/정적 사이트에는 신규 **publishable key**(`sb_publishable_...`)를 쓰는 것이 권장입니다.
> (구 anon 키도 아직 동작하며, 그 경우 `VITE_SUPABASE_ANON_KEY` 로 넣으면 됩니다.)
>
> publishable key는 공개되어도 되는 값입니다. 정적 사이트 번들에 포함되어 누구나 볼 수 있지만,
> 아래 RLS 정책 때문에 이 키로는 데이터를 **넣기만** 할 수 있고 읽거나 수정/삭제할 수 없습니다.
> (로그인 없는 요청은 Postgres의 `anon` **역할**로 매핑되므로, 정책의 `to anon` 은 키 종류와 무관하게 그대로 유효합니다.)

## 2. 테이블 + 보안 정책 만들기
Supabase 대시보드의 **SQL Editor** 에서 아래 SQL을 실행하세요.

```sql
-- 게임 기록 테이블
create table if not exists public.games (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  client_id      text,
  mode           text not null,       -- 'VS_CPU' | 'VS_HUMAN'
  cpu_difficulty text,                -- 'easy' | 'medium' | 'hard' | null
  engine_version text,
  winner         text not null,       -- 'PLAYER_1' | 'PLAYER_2' | 'DRAW'
  end_reason     text not null,       -- 'FINISHED' | 'SURRENDER'
  starting_player text,
  score_p1       integer,
  score_p2       integer,
  jellies_p1     integer,
  jellies_p2     integer,
  bullets_p1     integer,
  bullets_p2     integer,
  bullets_total  integer,
  turns          integer,
  language       text,
  history        jsonb
);

-- RLS 활성화
alter table public.games enable row level security;

-- anon(공개 키) 사용자는 INSERT만 가능. SELECT/UPDATE/DELETE 정책이 없으므로 조회/수정/삭제 불가.
create policy "anon can insert games"
  on public.games
  for insert
  to anon
  with check (true);
```

실행 후 **Table Editor** 에 `games` 테이블이 보이면 성공입니다.

## 3. 로컬에 접속 정보 넣기
프로젝트 루트의 `.env.local` 파일(이미 생성됨, git에 커밋되지 않음)에 값을 채워 넣습니다.

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...(publishable 키)
```

> 값이 비어 있으면 기록 저장 기능은 자동으로 꺼지고 게임은 정상 동작합니다.

## 4. 빌드 & 배포
환경변수는 **빌드 시점**에 번들에 삽입됩니다. 따라서 값을 채운 뒤 다시 빌드해야 합니다.

```bash
npm run build      # docs/ 폴더가 갱신됨 (.env.local 값이 반영됨)
git add docs
git commit -m "feat: log game results to Supabase"
git push
```

GitHub Pages가 `docs/` 를 서빙하므로 push 후 실제 사이트에 반영됩니다.

## 5. 동작 확인
- 배포된 사이트에서 게임을 한 판 끝냅니다.
- Supabase **Table Editor → games** 에 새 행이 생기면 정상 동작.
- 저장 실패는 게임 흐름을 막지 않으며, 로컬 개발(`npm run dev`) 시 콘솔에 경고만 출력됩니다.

## 참고: 분석 예시 쿼리
SQL Editor에서 실행:

```sql
-- 난이도별 사람(PLAYER_1) 승률
select cpu_difficulty,
       count(*) as games,
       round(100.0 * count(*) filter (where winner = 'PLAYER_1') / count(*), 1) as human_win_pct
from public.games
where mode = 'VS_CPU'
group by cpu_difficulty;
```
