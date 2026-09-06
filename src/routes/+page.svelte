<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { confirmationClass } from '#lib/pwdhash/Confirmation.gen.tsx';
	import { copyToClipboard } from '#lib/pwdhash/Clipboard.gen.tsx';
	import { extractDomain } from '#lib/pwdhash/DomainExtractor.gen.tsx';
	import { generatePassword } from '#lib/pwdhash/Password.gen.tsx';

	let domainInput = $state('');
	let sourcePassword = $state('');
	let confirmationInput = $state('');
	let generation = $state<ReturnType<typeof generatePassword> | null>(null);
	let hasRequestedGeneration = $state(false);
	let isGeneratedPasswordFocused = $state(false);
	let copyFeedback = $state<'idle' | 'copied' | 'failed'>('idle');
	let copyAttempt = 0;
	let bookmarkletHref = $state('');
	let initialFocus = $state<'domain' | 'password' | null>(null);

	let generatedPassword = $derived(generation?.TAG === 'Ok' ? generation._0 : '');
	let generatedPasswordDisplay = $derived(
		isGeneratedPasswordFocused || generatedPassword === ''
			? generatedPassword
			: `${generatedPassword.slice(0, 2)}${'*'.repeat(Math.max(generatedPassword.length - 2, 0))}`
	);
	let currentConfirmationClass = $derived(
		sourcePassword === '' ? 'neutral' : confirmationClass(sourcePassword, confirmationInput)
	);
	let confirmationMessage = $derived(
		currentConfirmationClass === 'matching-prefix'
			? 'Passwords match so far.'
			: currentConfirmationClass === 'exact-match'
				? 'Passwords match.'
				: currentConfirmationClass === 'mismatch'
					? 'Passwords do not match.'
					: ''
	);
	let domainError = $derived(
		hasRequestedGeneration && generation?.TAG === 'Error'
			? generation._0 === 'MissingDomain'
				? 'Enter a domain.'
				: 'Enter a valid domain.'
			: ''
	);

	function generateCurrentPassword() {
		copyAttempt += 1;
		copyFeedback = 'idle';

		if (sourcePassword === '') {
			generation = null;
			return;
		}

		generation = generatePassword(domainInput, sourcePassword);
	}

	function updateDomain(value: string) {
		domainInput = value;
		generateCurrentPassword();
	}

	function updateSourcePassword(value: string) {
		sourcePassword = value;
		if (value !== '') {
			hasRequestedGeneration = true;
		}
		generateCurrentPassword();
	}

	async function copyGeneratedPassword() {
		hasRequestedGeneration = true;
		copyAttempt += 1;
		const activeCopyAttempt = copyAttempt;
		copyFeedback = 'idle';
		if (sourcePassword === '') {
			generation = null;
			return;
		}

		generation = generatePassword(domainInput, sourcePassword);

		if (generation.TAG === 'Error') {
			return;
		}

		const result = await copyToClipboard(
			(text) => navigator.clipboard.writeText(text),
			generation._0
		);
		if (activeCopyAttempt === copyAttempt) {
			copyFeedback = result.TAG === 'Ok' ? 'copied' : 'failed';
		}
	}

	function bookmarkletDomain() {
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

	function createBookmarkletHref() {
		const generatorUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
		const script = `window.open(${JSON.stringify(`${generatorUrl}#`)}+encodeURIComponent(location.href),'_blank','noopener')`;
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
		bookmarkletHref = createBookmarkletHref();
		const initialDomain = bookmarkletDomain();
		if (initialDomain !== '') {
			const extractedDomain = extractDomain(initialDomain);
			updateDomain(extractedDomain.TAG === 'Ok' ? extractedDomain._0 : initialDomain);
		}
		initialFocus = initialDomain === '' ? 'domain' : 'password';
	});
</script>

<svelte:head>
	<title>PwdHash Generator</title>
</svelte:head>

<main>
	<h1>PwdHash Generator</h1>

	<form
		onsubmit={(event) => {
			event.preventDefault();
			void copyGeneratedPassword();
		}}
	>
		<div class="field">
			<label for="domain">Domain</label>
			<input
				id="domain"
				name="domain"
				type="text"
				autocomplete="url"
				aria-invalid={domainError === '' ? undefined : true}
				aria-describedby={domainError === '' ? undefined : 'domain-error'}
				value={domainInput}
				{@attach focusWhenSelected('domain', initialFocus)}
				oninput={(event) => updateDomain(event.currentTarget.value)}
			/>
			{#if domainError}
				<p id="domain-error" class="error" role="alert">{domainError}</p>
			{/if}
		</div>

		<div class="field">
			<label for="source-password">Password</label>
			<input
				id="source-password"
				name="source-password"
				type="password"
				autocomplete="current-password"
				value={sourcePassword}
				{@attach focusWhenSelected('password', initialFocus)}
				oninput={(event) => updateSourcePassword(event.currentTarget.value)}
			/>
		</div>

		<div class="field">
			<label for="confirmation">Confirm Password <span>(Optional)</span></label>
			<input
				id="confirmation"
				name="confirmation"
				type="password"
				autocomplete="off"
				class={currentConfirmationClass}
				bind:value={confirmationInput}
			/>
			<p class="confirmation-status" aria-live="polite">{confirmationMessage}</p>
		</div>

		<div class="field">
			<label for="generated-password">Generated Password</label>
			<input
				id="generated-password"
				name="generated-password"
				type="text"
				readonly
				autocomplete="off"
				value={generatedPasswordDisplay}
				aria-label="Generated password. Focus to reveal the full value."
				onfocus={async (event) => {
					const input = event.currentTarget;
					isGeneratedPasswordFocused = true;
					await tick();
					input.select();
				}}
				onblur={() => (isGeneratedPasswordFocused = false)}
			/>
		</div>

		<div class="actions">
			<button type="submit">Copy</button>
			<p class="copy-feedback" aria-live="polite">
				{#if copyFeedback === 'copied'}
					Copied.
				{:else if copyFeedback === 'failed'}
					Copy failed. Use the generated-password field instead.
				{/if}
			</p>
		</div>
	</form>

	<footer>
		Bookmarklet: <a href={bookmarkletHref}>pH</a>
		<span id="bookmarklet-help">Drag it to your bookmarks bar.</span>
	</footer>
</main>

<style>
	main {
		max-width: 32rem;
		margin: 3rem auto;
		padding: 0 1rem;
	}

	form,
	.field {
		display: grid;
		gap: 0.5rem;
	}

	form {
		gap: 1rem;
	}

	input,
	button {
		font: inherit;
	}

	input {
		padding: 0.5rem;
	}

	label span {
		font-style: italic;
		font-weight: normal;
	}

	.matching-prefix {
		background: #fff7cc;
	}

	.exact-match {
		background: #ddf7df;
	}

	.mismatch,
	input[aria-invalid='true'] {
		background: #ffe1e6;
	}

	.error {
		margin: 0;
		color: #a40022;
	}

	.actions {
		display: flex;
		align-items: baseline;
		gap: 1rem;
	}

	.copy-feedback {
		min-height: 1.5rem;
		margin: 0;
	}

	.confirmation-status {
		min-height: 1.5rem;
		margin: 0;
	}

	footer {
		margin-top: 2rem;
	}

	#bookmarklet-help {
		margin-left: 0.5rem;
	}
</style>
