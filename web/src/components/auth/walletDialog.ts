/*
 * Detects when the user closes the Proton wallet dialog (X button, Escape or a click outside).
 *
 * @proton/web-renderer 1.0.5 has an ordering bug: when the dialog is closed by the user, the modal
 * resets the shared UI state before the app can reject the pending wallet selection or call the
 * transport's close handler. The SDK promise then never settles and the login looks stuck.
 *
 * All programmatic opens and closes go through WebRenderer.prototype.show/close, while user closes
 * set the internal store directly. Counting the programmatic closes tells the two apart: a dialog
 * "close" event without a matching programmatic close was the user.
 */

type RendererInstance = {
    shadow?: ShadowRoot;
    __xhExpectedCloses?: number;
    __xhWatching?: boolean;
};

let dismissListener: (() => void) | null = null;
let installPromise: Promise<void> | null = null;

/** Registers the callback for a user-dismissed wallet dialog (one listener, the auth provider). */
export function setWalletDialogDismissListener(listener: (() => void) | null) {
    dismissListener = listener;
}

function dialogOf(renderer: RendererInstance): HTMLDialogElement | null {
    return renderer.shadow?.querySelector("dialog") ?? null;
}

function watch(renderer: RendererInstance) {
    if (renderer.__xhWatching || !renderer.shadow) return;
    renderer.__xhWatching = true;
    // "close" does not bubble, so listen in the capture phase on the shadow root
    renderer.shadow.addEventListener(
        "close",
        (event) => {
            if (!(event.target instanceof HTMLDialogElement)) return;
            if ((renderer.__xhExpectedCloses ?? 0) > 0) {
                renderer.__xhExpectedCloses = (renderer.__xhExpectedCloses ?? 1) - 1;
                return;
            }
            dismissListener?.();
        },
        true
    );
}

/** Patches the renderer once; safe to call many times. */
export function installWalletDialogWatcher(): Promise<void> {
    if (!installPromise) {
        installPromise = import("@proton/web-renderer")
            .then(({ WebRenderer }) => {
                const proto = WebRenderer.prototype as unknown as {
                    show: (this: RendererInstance) => void;
                    close: (this: RendererInstance) => void;
                };
                const originalShow = proto.show;
                const originalClose = proto.close;

                proto.show = function (this: RendererInstance) {
                    watch(this);
                    return originalShow.call(this);
                };
                proto.close = function (this: RendererInstance) {
                    // Only a close of an open dialog produces a "close" event to account for
                    if (dialogOf(this)?.open) this.__xhExpectedCloses = (this.__xhExpectedCloses ?? 0) + 1;
                    return originalClose.call(this);
                };
            })
            .catch((err) => {
                installPromise = null;
                throw err;
            });
    }
    return installPromise;
}
