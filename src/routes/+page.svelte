<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { presentConfirmation } from '#lib/pwdhash/Confirmation.gen.tsx';
	import { copyFeedbackMessage, copyToClipboard } from '#lib/pwdhash/Clipboard.gen.tsx';
	import { presentForm } from '#lib/pwdhash/Form.gen.tsx';

	let domainInput = $state('');
	let sourcePassword = $state('');
	let confirmationInput = $state('');
	let hasSubmitted = $state(false);
	let isGeneratedPasswordFocused = $state(false);
	let copyFeedback = $state('');
	let copyAttempt = 0;
	let bookmarkletHref = $state('');
	let initialFocus = $state<'domain' | 'password' | null>(null);

	let form = $derived(presentForm(domainInput, sourcePassword, hasSubmitted));
	let generatedPasswordDisplay = $derived(
		form.generatedPassword === undefined || isGeneratedPasswordFocused
			? (form.generatedPassword ?? '')
			: `${form.generatedPassword.slice(0, 2)}${'*'.repeat(Math.max(form.generatedPassword.length - 2, 0))}`
	);
	let confirmation = $derived(presentConfirmation(sourcePassword, confirmationInput));

	function resetCopyFeedback() {
		copyAttempt += 1;
		copyFeedback = '';
	}

	async function copyGeneratedPassword() {
		hasSubmitted = true;
		resetCopyFeedback();
		const activeCopyAttempt = copyAttempt;
		if (form.generatedPassword === undefined) {
			return;
		}

		const result = await copyToClipboard(
			(text) => navigator.clipboard.writeText(text),
			form.generatedPassword
		);
		if (activeCopyAttempt === copyAttempt) {
			copyFeedback = copyFeedbackMessage(result);
		}
	}

	function bookmarkletAddress() {
		const hash = window.location.hash.slice(1);
		if (hash === '') {
			return '';
		}

		try {
			return decodeURIComponent(hash);
		} catch {
			return hash;
		}
	}

	function createBookmarkletHref(generatorUrl: string) {
		const script = `window.open(${JSON.stringify(generatorUrl)}+'\\x23'+encodeURIComponent(location.href),'_blank','noopener')`;
		return `javascript:${script}`;
	}

	function focusWhenSelected(
		target: 'domain' | 'password',
		selected: 'domain' | 'password' | null
	) {
		return (element: HTMLInputElement) => {
			if (target === selected) {
				element.focus();
			}
		};
	}

	onMount(() => {
		const generatorUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
		bookmarkletHref = createBookmarkletHref(generatorUrl);
		const initialAddress = bookmarkletAddress();
		domainInput = initialAddress;
		initialFocus = initialAddress === '' ? 'domain' : 'password';
	});
</script>

<svelte:head>
	<title>PwdHash Generator</title>
</svelte:head>

<main>
	<h1>PwdHash Generator</h1>
	<p class="intro">Create a unique password for each site without storing your master password.</p>

	<form
		onsubmit={(event) => {
			event.preventDefault();
			void copyGeneratedPassword();
		}}
	>
		<label>
			Site Address
			<input
				autocomplete="url"
				aria-invalid={form.domainError === undefined ? undefined : true}
				bind:value={domainInput}
				{@attach focusWhenSelected('domain', initialFocus)}
				oninput={resetCopyFeedback}
			/>
			<small>
				{#if form.domainError}
					<span role="alert">{form.domainError}</span>
				{:else if form.resolvedDomain !== undefined}
					Domain: {form.resolvedDomain}
				{:else}
					Enter a site address.
				{/if}
			</small>
		</label>

		<label>
			Master Password
			<input
				type="password"
				autocomplete="current-password"
				aria-invalid={form.passwordError === undefined ? undefined : true}
				bind:value={sourcePassword}
				{@attach focusWhenSelected('password', initialFocus)}
				oninput={resetCopyFeedback}
			/>
			<small>
				{#if form.passwordError}<span role="alert">{form.passwordError}</span>{/if}
			</small>
		</label>

		<label>
			Confirm Master Password <em>(Optional)</em>
			<input
				type="password"
				autocomplete="off"
				class={confirmation.className}
				aria-invalid={confirmation.className === 'exact-match'
					? false
					: confirmation.className === 'mismatch'
						? true
						: undefined}
				bind:value={confirmationInput}
			/>
			<small aria-live="polite">{confirmation.message}</small>
		</label>

		<label>
			Generated Password
			<input
				readonly
				autocomplete="off"
				value={generatedPasswordDisplay}
				onfocus={async (event) => {
					const input = event.currentTarget;
					isGeneratedPasswordFocused = true;
					await tick();
					input.select();
				}}
				onblur={() => (isGeneratedPasswordFocused = false)}
			/>
		</label>
		<button type="submit">Copy</button>
		<p class="copy-feedback" aria-live="polite">{copyFeedback}</p>
	</form>

	<footer>
		<span class="bookmarklet">
			Bookmarklet: <a href={bookmarkletHref}>pH</a>
			<span class="bookmarklet-tooltip">Drag to your bookmarks bar.</span>
		</span>
		<a href="https://github.com/Leftium/pH">Source on GitHub</a>
	</footer>
</main>

<style>
	main {
		border: 1px solid var(--nc-border);
		border-radius: var(--nc-radius);
		padding: var(--nc-spacing);
	}

	h1 {
		text-align: center;
	}

	.intro {
		color: color-mix(in oklch, var(--nc-text), transparent 40%);
	}

	label:has(input) {
		font-weight: 600;
	}

	label > :is(input, small, em) {
		font-weight: 400;
	}

	.matching-prefix {
		background: light-dark(#fff7cc, oklch(0.3 0.05 90));
	}

	input[aria-invalid='false'] {
		background: light-dark(#ddf7df, oklch(0.3 0.05 145));
	}

	input[aria-invalid='true'] {
		background: light-dark(#ffe1e6, oklch(0.3 0.05 25));
	}

	form small {
		min-height: 1.5rem;
	}

	form > button {
		width: 100%;
	}

	.copy-feedback {
		min-height: 1.5rem;
		margin: 0;
	}

	footer {
		margin-top: 2rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 1rem;
	}

	.bookmarklet {
		position: relative;
	}

	.bookmarklet-tooltip {
		position: absolute;
		bottom: calc(100% + 0.5rem);
		left: 0;
		z-index: 1;
		width: max-content;
		max-width: min(18rem, calc(100vw - 3rem));
		padding: 0.35rem 0.5rem;
		border-radius: 0.25rem;
		background: #1f2937;
		color: white;
		font-size: 0.875rem;
		opacity: 0;
		pointer-events: none;
		transform: translateY(0.25rem);
		transition:
			opacity 0.1s,
			transform 0.1s;
	}

	.bookmarklet a:hover + .bookmarklet-tooltip,
	.bookmarklet:focus-within .bookmarklet-tooltip {
		opacity: 1;
		transform: translateY(0);
	}
</style>
