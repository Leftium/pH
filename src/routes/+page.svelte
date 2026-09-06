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
		<div class="field">
			<label for="domain">Site Address</label>
			<input
				id="domain"
				name="domain"
				type="text"
				autocomplete="url"
				aria-invalid={form.domainError === undefined ? undefined : true}
				aria-describedby="domain-status"
				bind:value={domainInput}
				{@attach focusWhenSelected('domain', initialFocus)}
				oninput={resetCopyFeedback}
			/>
			<p id="domain-status" class="field-status" class:error={form.domainError !== undefined}>
				{#if form.domainError}
					<span role="alert">{form.domainError}</span>
				{:else if form.resolvedDomain !== undefined}
					Domain: {form.resolvedDomain}
				{:else}
					Enter a site address.
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
				aria-invalid={form.passwordError === undefined ? undefined : true}
				aria-describedby="password-status"
				bind:value={sourcePassword}
				{@attach focusWhenSelected('password', initialFocus)}
				oninput={resetCopyFeedback}
			/>
			<p id="password-status" class="field-status" class:error={form.passwordError !== undefined}>
				{#if form.passwordError}<span role="alert">{form.passwordError}</span>{/if}
			</p>
		</div>

		<div class="field">
			<label for="confirmation">Confirm Master Password <span>(Optional)</span></label>
			<input
				id="confirmation"
				name="confirmation"
				type="password"
				autocomplete="off"
				class={confirmation.className}
				bind:value={confirmationInput}
			/>
			<p class="field-status" aria-live="polite">{confirmation.message}</p>
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
				<p class="copy-feedback" aria-live="polite">{copyFeedback}</p>
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

	.field-status {
		min-height: 1.5rem;
		margin: 0;
		color: #4b5563;
	}

	.field-status.error {
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
