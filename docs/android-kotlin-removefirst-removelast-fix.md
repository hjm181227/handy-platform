# Kotlin removeFirst/removeLast Android 15 충돌 해결 가이드

Google Play Console에서 릴리즈 v1.8 AAB 업로드 시 **"Kotlin 비호환성으로 인해 비정상 종료 발생"** 경고가 표시되어 조사 및 수정을 진행한 내용입니다. Kotlin의 `removeFirst()`/`removeLast()` 확장 함수가 Android 15(Java 21)의 `List` 메서드와 충돌하여 **Android 14 이하 기기에서 `NoSuchMethodError` 크래시**가 발생하는 문제입니다.

---

## 원인

`compileSdk 35`로 빌드 시 Kotlin 컴파일러가 `list.removeLast()` 호출을 Kotlin stdlib 확장 함수가 아닌 **Java 21의 `List.removeLast()`로 바인딩**합니다. Android 14 이하에는 이 메서드가 없어 런타임에 `NoSuchMethodError`로 크래시됩니다.

D8 컴파일러는 이 충돌을 감지하면 `ExternalSyntheticApiModelOutline0`이라는 synthetic class를 생성합니다. 이 클래스의 이름은 **실제 원인 파일과 무관하게** D8이 임의로 지정하므로, Play Console이 지목하는 클래스명만으로는 원인을 특정할 수 없습니다.

### 예시

Play Console 경고:
```
com.horcrux.svg.TSpanView$ExternalSyntheticApiModelOutline0.m
```

실제 원인:
```
@dr.pogodin/react-native-fs → ReactNativeFsModule.kt:176 → queue.removeLast()
```

D8이 여러 파일의 API 호환성 래퍼를 하나의 synthetic class에 묶기 때문에, `react-native-svg`의 `TSpanView` 이름이 붙었지만 실제 `removeLast()` 호출은 `react-native-fs`에 있었습니다.

---

## 영향받은 패키지 및 수정 내역

### 1. react-native-screens (직접 호출)

| 항목 | 내용 |
|------|------|
| 문제 코드 | `ScreenStack.kt:315` — `drawingOpPool.removeLast()` |
| 수정 버전 | 3.33.0+ (`removeAt(lastIndex)`로 교체) |
| 적용 버전 | **3.35.0** (RN 0.73 호환 최신, 3.36.0부터 `BaseReactPackage` 사용으로 비호환) |

### 2. @dr.pogodin/react-native-fs (직접 호출)

| 항목 | 내용 |
|------|------|
| 문제 코드 | `ReactNativeFsModule.kt:176` — `queue.removeLast()` |
| 수정 버전 | 2.29.1+ (`removeAt(queue.lastIndex)`로 교체) |
| 적용 방법 | **patch-package** (2.29.1+는 RN 0.73 codegen과 TurboModule 스펙 비호환) |

### 3. react-native-svg (직접 호출 없음)

Play Console이 `TSpanView`를 지목했지만, 소스 코드에 `removeFirst`/`removeLast` 호출이 없습니다. D8 synthetic class 이름 지정의 부산물입니다.

---

## 적용한 수정 사항

### package.json 변경

```diff
# packages/mobile/package.json

- "react-native-fs": "^2.20.0",
+ "@dr.pogodin/react-native-fs": "2.24.6",

- "react-native-screens": "3.29.0",
+ "react-native-screens": "3.35.0",

# postinstall 스크립트 추가
+ "postinstall": "npx patch-package --patch-dir patches",
```

### import 경로 변경 (2개 파일)

```diff
# NailSegmentationModel.ts:34, NailSegmentationAPI.ts:25
- import RNFS from 'react-native-fs';
+ import RNFS from '@dr.pogodin/react-native-fs';
```

### patch-package 패치

파일: `packages/mobile/patches/@dr.pogodin+react-native-fs+2.24.6.patch`

```diff
- val next = queue.removeLast()
+ val next = queue.removeAt(queue.lastIndex)
```

---

## 버전 호환성 제약 (RN 0.73.6 기준)

| 패키지 | 사용 가능 범위 | 제약 원인 |
|--------|---------------|----------|
| react-native-screens | 3.33.0 ~ **3.35.0** | 3.36.0+에서 `BaseReactPackage` 도입 (RN 0.74+ 전용) |
| @dr.pogodin/react-native-fs | **2.24.6** (패치 필요) | 2.29.1+에서 수정되었으나 TurboModule codegen 스펙이 RN 0.73과 비호환 |

---

## 업로드 전 사전 검증 방법

AAB의 DEX 바이트코드에서 문제가 되는 `ArrayList.removeLast()`/`List.removeLast()` 호출을 직접 검사할 수 있습니다.

```bash
AAB=packages/mobile/android/app/build/outputs/bundle/release/app-release.aab
TMPDIR=$(mktemp -d)
unzip -q "$AAB" -d "$TMPDIR"

for dex in "$TMPDIR"/base/dex/*.dex; do
  echo "=== $(basename $dex) ==="
  $ANDROID_HOME/build-tools/35.0.0/dexdump -d "$dex" \
    | grep "ArrayList;.removeLast\|ArrayList;.removeFirst\|List;.removeLast\|List;.removeFirst" \
    || echo "clean"
done

rm -rf "$TMPDIR"
```

**결과가 모두 `clean`이면 안전합니다.**

참고: `Deque.removeLast()`, `LinkedList.removeLast()`, `kotlin.collections.ArrayDeque.removeLast()` 등은 Android API 1부터 존재하므로 문제없습니다. `java.util.ArrayList`/`java.util.List`의 `removeLast`/`removeFirst`만 위험합니다.

---

## 효과 없는 방법들

| 방법 | 이유 |
|------|------|
| ProGuard/R8 규칙 | 컴파일 후 처리이므로 이미 바인딩된 메서드 참조를 바꿀 수 없음 |
| `coreLibraryDesugaring` | 컴파일 타임 메서드 해석 충돌이므로 해결 불가 |
| `compileSdk 34` 다운그레이드 | 임시 방편, Google Play가 곧 35 이상 요구 |
| react-native-svg 업그레이드 | TSpanView에 실제 문제 코드 없음, D8 naming 부산물 |

---

## 향후 대체 라이브러리 옵션

현재 `@dr.pogodin/react-native-fs`는 파일 읽기/쓰기/존재확인 3가지 기능만 사용 중입니다.

| 라이브러리 | compileSdk 35 | RN 0.73 | 코드 변경 | 언어 | 비고 |
|-----------|:---:|:---:|:---:|:---:|------|
| `@dr.pogodin/react-native-fs` 2.32.0+ | O | 미확인 | 없음 | Kotlin | 동일 API, RN 0.73 codegen 호환 테스트 필요 |
| `react-native-blob-util` 0.21.x | O | O | 필요 | **Java** | Kotlin 문제 원천 차단 |
| `react-native-file-access` | O | 미확인 | 필요 | Kotlin | 소규모 커뮤니티 |
| `expo-file-system` | O | O | 필요 | Kotlin | expo 인프라 필요 (과잉) |

RN 0.74+ 업그레이드 시 `@dr.pogodin/react-native-fs` 2.32.0+로 업그레이드하면 패치 없이 해결됩니다.

---

## 참고 링크

- [Kotlin removeFirst/removeLast Android 15 이슈 (JetBrains)](https://youtrack.jetbrains.com/issue/KT-71375)
- [Android 15 동작 변경사항 - OpenJDK API 변경](https://developer.android.com/about/versions/15/behavior-changes-15#openjdk-api-changes)
- [react-native-screens #2257 - removeLast crash on API 35](https://github.com/software-mansion/react-native-screens/issues/2257)
- [@dr.pogodin/react-native-fs #92 - removeLast Google Play 경고](https://github.com/birdofpreyru/react-native-fs/issues/92)
