# Shared Drive 관리 스크립트 README

이 프로젝트는 Google Apps Script를 이용해 **조직의 공유 드라이브(Shared Drive) 목록과 멤버 권한을 스프레드시트로 내보내고**,
해당 정보를 기반으로 **새 도메인으로 멤버 이메일을 변환한 복제 Shared Drive를 생성**하는 자동화 스크립트입니다.

## 기능 요약

### 1) `listSharedDrives()`

* 조직 내 Shared Drive 목록을 페이지네이션으로 조회
* 각 Drive의 멤버(이메일)와 권한(role)을 조회
* 조회 결과를 현재 활성 시트에 아래 컬럼으로 출력

  * `Drive Name`
  * `Member`
  * `Permission`

### 2) `createSharedDriveWithNewDomain()`

* 시트에 정리된 Shared Drive/멤버/권한 정보를 읽어서

  1. 기존 Drive 이름 기반으로 새 Shared Drive 생성 (`" - copy"` suffix)
  2. 멤버 이메일의 도메인을 새 도메인으로 변경
  3. 기존 권한(role) 그대로 새 Shared Drive에 멤버 추가

### 3) `onOpen(e)`

* 스프레드시트 열 때 애드온 메뉴 생성
* 메뉴에 아래 항목 추가

  * **List all shared drives** → `listSharedDrives()` 실행
  * **update member** → 현재는 연결된 함수가 없음(추가 개발 필요)

---

## 사전 요구사항

1. **Google Workspace 관리자 권한**

   * `Drive.Drives.list`, `Drive.Permissions.list/insert`를 `useDomainAdminAccess: true`로 호출하므로
   * 실행 계정은 최소 Drive Admin 권한 필요

2. **Apps Script 고급 서비스(Advanced Google Services) 활성화**

   * 스크립트에서 `Drive` 고급 서비스를 사용합니다.
   * Apps Script 편집기에서:

     * `서비스(Services)` → **Drive API** 추가/활성화

3. **Google Cloud Console에서 Drive API 활성화**

   * Apps Script 프로젝트가 연결된 GCP 프로젝트에서 Drive API가 켜져 있어야 합니다.

---

## 설치 및 설정

1. 스프레드시트 생성
2. **확장 프로그램 → Apps Script**에서 새 프로젝트 생성 후 코드 붙여넣기
3. 고급 서비스 Drive API 활성화
4. 권한 승인(최초 실행 시)

---

## 사용 방법

### Step 1. Shared Drive 목록 가져오기

1. 스프레드시트를 새로고침 / 다시 열기
2. 상단 메뉴에서
   **확장 프로그램 → 애드온 메뉴 → List all shared drives**
3. 현재 시트에 결과가 자동 작성됩니다.

출력 예시:

| Drive Name       | Member                                | Permission    |
| ---------------- | ------------------------------------- | ------------- |
| Sales Team Drive | [user1@old.com](mailto:user1@old.com) | fileOrganizer |
| Sales Team Drive | [user2@old.com](mailto:user2@old.com) | organizer     |
| HR Drive         | [user3@old.com](mailto:user3@old.com) | reader        |

---

### Step 2. 새 도메인으로 Drive 복제 + 멤버 이관

1. `createSharedDriveWithNewDomain()` 함수 내부에서 도메인 값을 수정합니다.

```js
var newDomain = "newdomain.com";  // 변경할 새로운 도메인명
```

2. Apps Script에서 `createSharedDriveWithNewDomain()` 실행
3. 시트의 각 행을 기반으로 새로운 Shared Drive들이 생성되고,
   기존 멤버 이메일의 **@뒤 도메인만 새 도메인으로 치환**되어 추가됩니다.

---

## 주의사항 / 제한

1. **중복 생성 위험**

   * 실행할 때마다 `" - copy"` 이름으로 계속 새 드라이브가 만들어집니다.
   * 재실행 전에 생성 여부를 체크하는 로직이 필요할 수 있습니다.

2. **멤버가 여러 명인 Drive**

   * 현재 로직은 시트의 **각 행마다 Drive를 생성**합니다.
   * 즉 한 Drive가 멤버 10명이면 10개의 복제 Drive가 생깁니다.
   * 의도한 동작이 아니라면:

     * Drive 이름 기준으로 그룹핑 후 Drive는 1번만 만들고
     * 멤버만 반복 추가하도록 수정해야 합니다.

3. **`update member` 메뉴는 미구현**

   * `onOpen()`에서 `"update member"`를 호출하지만 함수가 없습니다.
   * 메뉴 클릭 시 에러가 발생합니다.
   * 필요하면 해당 기능 함수 추가해드릴게요.

4. **이메일 형식 가정**

   * `memberEmail.split("@")`로 로컬파트/도메인을 분리합니다.
   * 그룹/서비스 계정/비정상 값이 들어오면 오류 가능.

---

## 권한(Scopes)

Drive Admin 액세스를 위해 아래 권한이 필요합니다.

* `https://www.googleapis.com/auth/drive`
* `https://www.googleapis.com/auth/spreadsheets`

Apps Script 실행 시 승인 요청으로 자동 표시됩니다.

---

## 개선 아이디어(권장)

* Drive 이름 기준 **중복 생성 방지**
* Drive별 멤버 **한 번에 추가하도록 구조 변경**
* 특정 OU / 특정 prefix Drive만 필터링 옵션
* 로그를 시트/Stackdriver에 더 상세히 남기기
* “copy” 대신 날짜/버전 suffix 적용

