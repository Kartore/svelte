# React → Svelte 移植ガイド（kartore）

React 版: `/Users/nekoyasan/Developer/kartore/react`（読み取り専用。変更禁止）
Svelte 版: `/Users/nekoyasan/Developer/kartore/svelte`（ここに実装する）

## 大原則

- **忠実移植**: React 版の DOM 構造・Tailwind クラス・表示文字列・挙動をそのまま再現する。リファクタや「改善」はしない。
- Svelte 5 runes モード（プロジェクト全体で強制）。`$state` / `$derived` / `$effect` / `$props` / `$bindable` を使う。legacy な `export let` / `$:` は禁止。
- TypeScript。React 版の型定義（Props の union 型など）は可能な限りそのまま移す。
- データフローは React 版と同じ **data-down / events-up**。式ツリーや mapStyle は親が所有し、`onChange` コールバックで上に返す。式エディタ系で `bind:` による双方向バインドは使わない（末端の入力ウィジェット内部の draft 管理は自由）。

## ファイル対応規則

| React                          | Svelte                                                                    |
| ------------------------------ | ------------------------------------------------------------------------- |
| `src/components/X/X.tsx`       | `src/lib/components/X/X.svelte`                                           |
| `src/components/.../X.util.ts` | 同じ場所にほぼverbatimコピー（`~/` importだけ `$lib/` に置換）            |
| `src/components/.../index.ts`  | `export { default as X } from './X.svelte'; export * from './X.util.ts';` |
| import `~/components/...`      | `$lib/components/...`                                                     |
| import `~/utils/...`           | `$lib/utils/...`                                                          |
| `*.test.ts(x)`                 | 移植しない（今回はスキップ）                                              |

- 相対/エイリアス import には拡張子を明示する（`.ts` / `.svelte`）。tsconfig が `rewriteRelativeImportExtensions: true`。
- インデントはタブ。prettier 設定に従う（`pnpm format` で整形可能）。

## React → Svelte イディオム対応

- `FC<Props>` + `className` → `let { class: className, children, ...props }: Props = $props()`
- ルート要素へ rest spread: `<div {...props} class={cn('...', className)}>`
- `children: ReactNode` → `children?: Snippet`、描画は `{@render children?.()}`
- `useState` → `$state`、`useMemo` → `$derived` / `$derived.by`、`useEffect` → `$effect`（可能なら `$derived` を優先）
- `Fragment` + `key` の map → `{#each ... as x, i (key)}`
- ローカルサブコンポーネント（同ファイル内の小 FC）→ `{#snippet name(args)}` か、同フォルダの別 `.svelte` ファイル
- `onPress` → `onclick`、`isDisabled` → `disabled`
- `useId` → `$props.id()`
- context: `createContext/useContext` → `setContext/getContext`。リアクティビティ維持のため **getter 関数を渡す**（下記参照）

## 共通コンポーネント API（実装済み・変更禁止）

すべて `$lib/components/common/<Name>` から import。

- `Button`: `{ class?, ref?: $bindable, children?, ...HTMLButtonAttributes }`。`onclick` / `disabled` / `aria-label` / `title` は属性としてそのまま渡す。
- `TextField`: `{ class?, label?, value?: $bindable<string>, onValueChange?, description?, disabled?, 'aria-label'? }`
- `NumberField`: `{ class?, label?, value?: number, onValueChange?: (n:number)=>void, minValue?, maxValue?, step?, formatOptions?: NumberFormatOptions, showButton?, description?, disabled?, 'aria-label'? }`
- `Switch`: `{ class?, label: string, checked?: $bindable<boolean>, onCheckedChange?, disabled? }`
- `Select`: `{ class?, triggerClass?, label?, items?: SelectItem[], sections?: SelectSection[], value?: $bindable<string|undefined>, onValueChange?, disabled?, 'aria-label'? }`
  - `SelectItem = { value: string; label: string; disabled?: boolean }`、`SelectSection = { title: string; items: SelectItem[] }`
  - react-aria の `<Item>/<Section>` collection API は items/sections 配列に変換する。`selectedKey`→`value`、`onSelectionChange`→`onValueChange`。
- `ComboBox`: `{ class?, label?, items?: SelectItem[], value?: $bindable, onValueChange?, disabled?, 'aria-label'? }`
- `Popover`: `{ open?: $bindable, onOpenChange?, trigger: Snippet, triggerClass?, contentClass?, 'aria-label'?, children: Snippet }`（トリガー内包型。react-aria 版の state/triggerRef 方式とは形が違うので呼び出し側を合わせて変える）
- `BoxRadioGroup`: `{ class?, label?, items: {value,label}[], value?: $bindable, onValueChange?, disabled? }`
- `RangeSlider`: `{ class?, label?, value?: $bindable<number[]>, onValueChange?, minValue?, maxValue?, step?, formatOptions?, sliderThumbLabel?: [string,string], disabled? }`
- `NumberArrayField`: `{ class?, label, arrayLabels: [string,string], values: [number,number], onChange }`
- `MonacoEditor`: `{ class?, value?, language?, options?, onChange?: (v:string)=>void, onMount?: (editor, monaco)=>void }`

## Color 契約（react-aria/color の置き換え）

`$lib/utils/color.ts` に自前 `Color` クラスを実装する（@react-stately/color の API サーフェスを模倣）:

- `parseColor(value: string): Color`（throw する。hex `#rgb/#rrggbb/#rrggbbaa`、`rgb()/rgba()`、`hsl()/hsla()`、`hsb()/hsba()` をサポート）
- `color.toFormat('rgb'|'rgba'|'hsl'|'hsla'|'hsb'|'hsba'): Color`
- `color.toString(format: 'css'|'hex'|'hexa'|'rgb'|'rgba'|'hsl'|'hsla'|'hsb'|'hsba'): string`
- `color.getChannelValue(channel)`, `color.withChannelValue(channel, value): Color`
- `color.getChannelRange(channel): { minValue, maxValue, step }`
- `color.getColorChannels(): [Channel, Channel, Channel]`（現在の色空間の3チャンネル）
- `ColorChannel = 'red'|'green'|'blue'|'hue'|'saturation'|'lightness'|'brightness'|'alpha'`

`ColorPicker`（`$lib/components/common/ColorField/ColorPicker`）の公開 props 契約:
`{ value?: Color, onChange?: (color: Color) => void, 'aria-label'? }`
（swatch ボタン + Popover で ColorArea / スライダー / チャンネル入力を表示）

`ColorField` の公開 props 契約（React 版と同等）:
`{ class?, label?, value?: string | Color, onChange?: (color: Color | null) => void }`

## 式エディタの Context

`$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext/ExpressionSuggestionsContext.ts`:

```ts
import { getContext, setContext } from 'svelte';

export type ExpressionSuggestionValue = string | number | boolean;
export type ExpressionSuggestions = {
	propertyKeys: { name: string; type?: string }[];
	getValueSuggestions: (key: string) => ExpressionSuggestionValue[];
};

const KEY = Symbol('expression-suggestions');

// provider 側: リアクティビティを保つため getter を登録する
export const provideExpressionSuggestions = (get: () => ExpressionSuggestions | undefined) => {
	setContext(KEY, get);
};

// consumer 側: getter を受け取り、使う側で $derived(getter()) する
export const useExpressionSuggestions = (): (() => ExpressionSuggestions | undefined) => {
	return (
		getContext<(() => ExpressionSuggestions | undefined) | undefined>(KEY) ?? (() => undefined)
	);
};
```

## 式エディタ共通部品 API（式 InputField から使う）

- `ExpressionOperatorSelect`: `{ value: ExpressionSpecification, onChange?, label?, class? }`
- `ExpressionArgInputField`: `{ class?, children?, parentValue, index, onChange?, onRemove?, disableConvert?, suggestion?: 'propertyKey' | { kind:'propertyValue'; key:string }, literalType?: 'color' }`
- `ExpressionInputTypeInputField`: `{ class?, children?, value, onChange?, suggestions?, literalType?: 'color' }`
- `ExpressionAppendArgButton`: `{ value, onChange?, class? }`
- `ExpressionInputField`（dispatcher）: `{ class?, children?, value: ExpressionSpecification, onChange?, ...rest }`

## 式 InputField（~60種）の移植パターン

React 版 `XInputField.tsx` + `XInputField.util.ts` + `index.ts` →
Svelte 版 `XInputField.svelte` + `XInputField.util.ts`（verbatim コピー）+ `index.ts`。

`GetInputField.svelte` の見本:

```svelte
<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ExpressionArgInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionOperatorSelect } from '$lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		value,
		onChange,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: [
			'get',
			string | ExpressionSpecification,
			(Record<string, unknown> | ExpressionSpecification)?
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const items = $derived(value[2]);
</script>

<div
	{...props}
	class={cn(
		'flex flex-row flex-wrap items-center gap-2 rounded bg-black/5 px-0.5 py-0.5',
		className
	)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	<ExpressionArgInputField parentValue={expression} index={1} {onChange} suggestion="propertyKey" />
	<div class="flex flex-row px-0.5 py-0.5">from</div>
	{#if items !== undefined}
		<ExpressionArgInputField parentValue={expression} index={2} {onChange} />
	{:else}
		<div class="flex flex-row px-0.5 py-0.5">this features</div>
	{/if}
	{@render children?.()}
</div>
```

要点:

- 型ガード（`isXExpressionSpecification`）は util にあり verbatim コピー。
- React 版の `value[...]` 添字アクセス・`replaceArgAt`/`removeArgsAt`/`insertArgsAt` の使い方をそのまま写す。
- `useExpressionSuggestions()` を使う場合: `const getSuggestions = useExpressionSuggestions();` して `$derived(getSuggestions())`。

## 検証

自分の担当ファイルを書いたら:

```sh
cd /Users/nekoyasan/Developer/kartore/svelte
pnpm exec svelte-check --tsconfig ./tsconfig.json 2>&1 | grep -E "^/.*(Error|Warn)" | grep <担当ディレクトリ>
```

他人の担当分のエラーは無視してよい。自分の担当分のエラーは必ず解消する。
