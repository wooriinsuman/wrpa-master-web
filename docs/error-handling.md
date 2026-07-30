# 에러 처리

백엔드(`wrpa-master-v2`)는 모든 에러를 하나의 봉투로 반환한다.

```json
{ "error": { "code": "invalid_credentials", "message": "invalid credentials" } }
```

규약의 원본은 백엔드의 `docs/error-contract.md`다. 이 문서는 그 봉투를
브라우저까지 어떻게 온전히 전달하고, 한국어 문구를 어디서 붙이는지를 다룬다.

핵심 규칙 두 가지만 기억하면 된다.

- **`message`는 화면에 절대 표시하지 않는다.** 영문 개발자용이다.
- **`code`로만 분기한다.** 한국어 문구는 이 프로젝트가 소유한다.

## 프록시: 봉투를 원형 그대로 중계한다

`server/api/`의 라우트는 실패한 업스트림 응답을 **throw하지 않는다.** 상태코드를
세우고 백엔드 봉투를 그대로 반환한다.

```ts
const NETWORK_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET']

catch (err: any) {
  const status = err?.response?.status
  if (status) {
    if (status === 401) deleteCookie(event, 'access_token')
    setResponseStatus(event, status)
    return err.data   // {error:{code,message}} — 원형 그대로
  }
  const code = err?.cause?.code ?? err?.code
  if (NETWORK_CODES.includes(code)) {
    console.error(`[proxy] RPA API unreachable (${code})`)
    setResponseStatus(event, 502)
    return { error: { code: 'upstream_unavailable', message: `RPA API unreachable (${code})` } }
  }
  throw err   // 진짜 예상 못한 것만 h3로 넘긴다
}
```

### throw하면 안 되는 이유

**`createError({ data: 봉투 })`로 던지면 봉투가 파묻힌다.** Nitro의 에러 핸들러는
응답 본문을 `{ error: true, url, statusCode, statusMessage, message, data }`로
만든다(`nitropack/dist/runtime/internal/error/{dev,prod}.mjs`). 최상위 `error`가
불리언 `true`라서 클라이언트의 `e.data.error.code`는 읽히지 않고, 봉투는
`e.data.data.error.code`라는 경로로 밀려난다. 계약이 Nitro 구현 세부에 묶인다.

**그냥 rethrow하면 로그가 폭발한다.** `$fetch`가 던지는 `FetchError`는 `H3Error`가
아니라서 h3가 `unhandled` 표시를 붙이고(`h3/dist/index.mjs:2320`), Nitro가
`[request error] [unhandled]`와 함께 스택트레이스·`[CAUSE]`를 통째로 찍는다.
로그인 실패 같은 정상적인 상황이 서버 크래시처럼 보인다.

### 이 방식은 h3 자신의 프록시 구현과 같다

관용구 이탈이 아니다. h3의 `sendProxy`가 하는 일이 정확히 이것이다 —
`ignoreResponseError: true`를 하드코딩해 업스트림 4xx/5xx 본문을 그대로 중계하고
(`h3/dist/index.mjs:1181`), 상태코드를 그대로 세우고(1192행), 네트워크 실패만
`createError({ status: 502 })`로 바꾼다(1186행).

### 그런데 `proxyRequest`를 쓰지는 않는다

h3의 `proxyRequest`/`sendProxy`가 위를 다 해주지만 채택하지 않았다. 헤더 처리가
**허용목록에서 차단목록으로 후퇴**하기 때문이다.

`server/utils/proxy-helpers.ts`의 `buildProxyHeaders`는 `Authorization`과
`X-Upload-Token` **둘만** 백엔드로 보낸다. 브라우저에서 온 것은 아무것도 통과하지
못한다. 반면 `proxyRequest`는 `getProxyRequestHeaders`를 쓰는데, 이건 8개
헤더(`host`, `accept` 등)만 제외하고 나머지를 전부 전달한다 — `cookie`가 제외
목록에 없어서 **httpOnly `access_token` 쿠키가 백엔드로 그대로 나간다.**

브라우저와 백엔드를 의도적으로 격리하는 BFF에서 이건 받아들일 수 없다. 그래서
`$fetch` + 허용목록을 유지하고, 중계 semantics만 `sendProxy`를 모사한다.

### `upstream_unavailable`

백엔드가 아예 응답하지 못한 경우(`ECONNREFUSED` 등) 프록시가 **같은 봉투 모양으로
합성**한다. 이걸로 "프록시를 통과한 모든 에러는 단일 모양"이라는 불변식이 서고,
클라이언트는 예외 없이 `e.data.error.code` 하나만 보면 된다.

내부 주소는 절대 클라이언트로 내보내지 않는다. 업스트림 URL은 서버 로그에만 남긴다.

백엔드가 응답은 했지만 봉투 밖 형태(HTML 게이트웨이 오류 등)일 때는
`upstream_error`를 합성한다. 두 code 모두 백엔드는 절대 내보내지 않는다.

## 클라이언트: code → 한국어

`app/utils/apiError.ts`가 유일한 진입점이다.

```ts
extractApiError(e, fallback, overrides?)
```

우선순위는 `overrides[code]` → 공용 매핑 → `fallback`이다.

`overrides`는 선택 인자로 뒤에 붙으므로 기존 호출부(`useCrudPage.ts`, `schedules`,
`order-policies`, `jobs`, `holidays`)는 그대로 두면 된다. 인자를 바꾸지
않아도 code 기반 문구를 자동으로 얻고, 매핑에 없는 code에서만 기존 fallback이
그대로 쓰인다.

### 공용 매핑에 넣는 code

화면 문맥과 무관하게 **단일 문구가 옳은 것만** 넣는다.

| code | 문구 |
|---|---|
| `invalid_credentials` | 아이디 또는 비밀번호가 올바르지 않습니다. |
| `account_inactive` | 비활성화된 계정입니다. 관리자에게 문의하세요. |
| `unauthorized` | 세션이 만료되었습니다. 다시 로그인해 주세요. |
| `forbidden` | 권한이 없습니다. |
| `work_not_pending` | 대기 중인 작업만 조정할 수 있습니다. |
| `workfile_in_use` | 작업파일이 참조 중이라 삭제할 수 없습니다. |
| `workfile_duplicate` | 같은 보험사에 동일한 분류 조합(데이터/유형/보종/컨텐츠)의 작업 파일이 이미 있습니다. |
| `username_taken` | 이미 사용 중인 아이디입니다. 정지된 계정이 쓰고 있을 수 있으니 목록에서 해당 계정을 재활성화하거나 완전 삭제해 주세요. |
| `company_required` | 관리자·사용자 역할은 회사가 필요합니다. 회사를 선택한 뒤 저장해 주세요. |
| `user_active` | 정지된 계정만 완전 삭제할 수 있습니다. 먼저 정지한 뒤 삭제해 주세요. |
| `self_delete` | 자기 계정은 삭제할 수 없습니다. 다른 시스템 관리자에게 요청해 주세요. |
| `self_deactivate` | 자기 계정은 정지할 수 없습니다. 다른 시스템 관리자에게 요청해 주세요. |
| `last_system_user` | 마지막 시스템 관리자 계정입니다. 다른 시스템 관리자를 먼저 만들어 주세요. |
| `invalid_reference` | 선택한 회사 또는 역할이 존재하지 않습니다. 목록을 다시 불러온 뒤 시도해 주세요. |
| `upstream_error` | RPA API 응답을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요. |
| `upstream_unavailable` | RPA API를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요. |

`workfile_in_use`는 대상 코드를 덧붙이면 더 친절해지지만, 그건 화면이 `overrides`로
할 일이다(아래 참조). 공용 매핑에는 코드 없이도 말이 되는 기본 문장을 둬서, 화면이
override하지 않아도 문구가 비지 않게 한다.

`username_taken`은 문구가 **해결 경로까지** 담는 드문 경우다. 사용자 등록 500
버그의 실제 원인은 정지된 계정이 아이디를 쥐고 있었다는 것이다. 아이디 UNIQUE
제약은 정지된 계정까지 포함하는데, 사용자 목록 기본값이 이제 '전체'라서 그
계정은 이미 화면에 보인다 — 그래서 "어디서 찾아라"를 안내할 필요가 없고, 문구는
곧바로 조치를 말한다: 목록에서 해당 계정을 재활성화하거나 완전 삭제하라고
두 가지 해결책을 직접 제시한다.

### 공용 매핑에 넣지 않는 code

`not_found`, `bad_request`, `conflict`는 **일부러 뺀다.**

화면이 자기 엔티티를 안다. holidays 페이지는 자기가 '휴일'을 물었다는 걸 알기
때문에 호출부의 `fallback`("휴일을 찾을 수 없습니다")이 공용 문구("대상을 찾을 수
없습니다")보다 항상 더 정확하다. 공용 매핑에 넣으면 우선순위상 공용 문구가 더 나은
fallback을 덮어써 **오히려 퇴행한다.**

백엔드가 이 code들을 안 쪼갠 이유와 같은 논리다. 쪼개지 않은 대신 그 문맥을
호출부가 채운다.

### 동적 값은 화면이 보간한다

백엔드는 요청별 값을 `message`에만 담을 수 있다(`workfile_in_use`가 데이터타입
코드를 덧붙인다). 그 `message`는 영문이고 표시 금지이므로, **영문 문자열을 파싱해
값을 꺼내는 일은 절대 하지 않는다.**

값은 화면이 이미 갖고 있다 — 자기가 보낸 것이기 때문이다. `overrides`로 넣는다.

```ts
extractApiError(e, '데이터타입 삭제에 실패했습니다.', {
  workfile_in_use: `작업파일이 참조 중이라 삭제할 수 없습니다: ${code}`,
})
```

화면이 재구성할 수 없는 값이 필요해지면 백엔드에 구조화된 필드를 요청한다.
`message` 파싱은 대안이 아니다.

### 미지 code는 반드시 fallback으로 떨어진다

`fallback`은 선택이 아니다. 백엔드에 새 code가 추가되면 이 프로젝트는 그 code의
문구를 모른다. 매핑에 없는 code는 조용히 `fallback`으로 떨어져야 하고, 화면이
비거나 `undefined`가 뜨면 안 된다.

이 때문에 **배포 순서가 강제된다**: 이 프로젝트의 fallback이 백엔드가 새 code를
내보내기 전에 먼저 배포되어야 한다.

## 상태

프록시 중계(`server/utils/proxy-error.ts`)와 `extractApiError`의 code 분기는
구현 완료다. 라우트 3곳(`[...].ts`, `auth/login.post.ts`,
`packages-upload.post.ts`)이 모두 같은 헬퍼를 쓴다.

SSR(`useAsyncData` 경유) 경로: 이 프로젝트에는 `useFetch`가 없다 —
`useApi()`는 `$fetch.create()`(ofetch)이고, 모든 composable이 `useAsyncData(key,
() => api.list())` 형태로 그 인스턴스를 그대로 호출한다. 즉 SSR과 클라이언트가
같은 ofetch 코드 경로를 탄다. 그리고 실제로 `extractApiError`를 호출하는 5곳
(`useCrudPage.ts`의 save/remove, `holidays`, `jobs`, `order-policies`,
`schedules`)은 전부 버튼 클릭·폼 제출 같은 사용자 상호작용 핸들러 안의
try/catch이며 브라우저에서만 실행된다 — SSR 중 실행되는 `useAsyncData` 호출은
어느 페이지도 `error`를 구조 분해하지 않아 `extractApiError`에 넘기지 않는다
(`login.vue`의 `error.value`도 로컬 ref일 뿐 Nuxt의 fetch error가 아니다). 따라서
현재 코드베이스에는 SSR 에러를 `extractApiError`로 소비하는 지점이 없다 —
근거: grep으로 확인한 사실(확신 높음).

참고로 만약 향후 어떤 페이지가 SSR 에러의 `.data.error.code`를 읽으려 한다면,
프록시가 `createError` 대신 `setResponseStatus` + `return body`를 쓰기 때문에
Nitro의 내부 호출도 동일한 h3 송신 경로(상태코드 + JSON 본문)를 타고, 그 응답을
받는 쪽도 동일한 ofetch 인스턴스이므로 봉투가 보존될 가능성이 높다 — 다만 이는
실행 검증이 아닌 추론이며(확신 중간), 실제로 그런 소비 지점이 생기면 별도로
검증이 필요하다.
