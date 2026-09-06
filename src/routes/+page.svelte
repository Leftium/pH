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
	let resolvedDomain = $derived.by(() => {
		if (domainInput === '') {
			return '';
		}

		const extractedDomain = extractDomain(domainInput);
		return extractedDomain.TAG === 'Ok' ? extractedDomain._0 : '';
	});

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
	<p class="intro">
		Create a unique password for each domain without storing your master password.
	</p>

	<form
		onsubmit={(event) => {
			event.preventDefault();
			void copyGeneratedPassword();
		}}
	>
		<div class="field">
			<label for="domain">Site Address</label>
			<input
				id="domain"
				name="domain"
				type="text"
				autocomplete="url"
				aria-invalid={domainError === '' ? undefined : true}
				aria-describedby="domain-status"
				value={domainInput}
				{@attach focusWhenSelected('domain', initialFocus)}
				oninput={(event) => updateDomain(event.currentTarget.value)}
			/>
			<p id="domain-status" class:error={domainError !== ''}>
				{#if domainError}
					<span role="alert">{domainError}</span>
				{:else if resolvedDomain !== ''}
					Domain: {resolvedDomain}
				{:else}
					Enter a domain or paste a full URL.
				{/if}
			</p>
		</div>

		<div class="field">
			<label for="source-password">Master Password</label>
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
			<label for="confirmation">Confirm Master Password <span>(Optional)</span></label>
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
		</div>
	</form>

	<footer>
		<div class="footer-row">
			<span class="bookmarklet">
				Bookmarklet: <a href={bookmarkletHref} aria-describedby="bookmarklet-help">pH</a>
				<span id="bookmarklet-help" class="bookmarklet-tooltip" role="tooltip">
					Drag to your bookmarks bar.
				</span>
			</span>
			<a href="https://github.com/Leftium/pH">Source on GitHub</a>
		</div>
	</footer>
</main>

<style>
	main {
		max-width: 32rem;
		margin: 3rem auto;
		padding: 2rem 1.5rem;
		border: 1px solid #d9dee7;
		border-radius: 0.75rem;
		box-shadow: 0 0.5rem 1.5rem rgb(28 38 55 / 8%);
	}

	h1 {
		margin-top: 0;
	}

	.intro {
		margin: -0.5rem 0 1.5rem;
		color: #4b5563;
	}

	form,
	.field {
		display: grid;
		gap: 0.25rem;
	}

	form {
		gap: 1.25rem;
	}

	input,
	button {
		font: inherit;
	}

	input {
		padding: 0.5rem;
		border: 1px solid #aeb7c4;
		border-radius: 0.35rem;
	}

	.field label,
	.field input,
	.actions button {
		margin: 0;
	}

	button {
		padding: 0.5rem 1rem;
		border: 0;
		border-radius: 0.35rem;
		background: #2457a6;
		color: white;
		cursor: pointer;
	}

	button:hover {
		background: #1c4584;
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

	#domain-status {
		min-height: 1.5rem;
		margin: 0;
		color: #4b5563;
	}

	#domain-status.error {
		color: #a40022;
	}

	.actions {
		display: grid;
		gap: 0.25rem;
	}

	.actions button {
		width: 100%;
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

	.footer-row {
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
