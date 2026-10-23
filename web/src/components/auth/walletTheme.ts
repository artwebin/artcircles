import type { UIOptions } from "@proton/web-sdk";

// XPR Circles brand colors (mirrors globals.css; the wallet UI renders in a shadow DOM)
const BRAND = {
    brand: "#0B5A4E",
    brandHover: "#083F37",
    onBrand: "#FFFFFF",
    text: "#1B2A2F",
    textSecondary: "#5A6E72",
    surface: "#FFFFFF",
    surfaceMuted: "#F4F6F4",
    border: "#E1E5E0",
    borderSubtle: "#EEF0ED",
};

/** Theme for the Proton Web SDK wallet selector and signing dialogs. */
export const walletUiOptions: UIOptions = {
    theme: "light",
    appInfo: {
        name: "XPR Circles",
        logo: "/images/Circle_logo.svg",
        logoRounded: false,
    },
    themes: {
        light: {
            base: {
                textColorBase: BRAND.text,
                textColorSecondary: BRAND.textSecondary,
                textColorLink: BRAND.brand,
                textColorSecondaryLink: BRAND.brandHover,
                bodyBackground: BRAND.surface,
                scrollBackground: "transparent",
                scrollThumbBackground: BRAND.border,
                logoBackgroundColor: "transparent",
                borderColor: BRAND.borderSubtle,
                windowBorderColor: BRAND.border,
            },
            tabs: {
                background: BRAND.surfaceMuted,
                backgroundActive: BRAND.brand,
                textColorActive: BRAND.onBrand,
            },
            list: {
                background: BRAND.surfaceMuted,
                borderColor: BRAND.border,
            },
            button: {
                icon: {
                    backgroundHover: BRAND.surfaceMuted,
                },
                primary: {
                    borderColor: BRAND.border,
                    borderColorHover: BRAND.brand,
                    backgroundHover: BRAND.surfaceMuted,
                },
                outlined: {
                    borderColor: BRAND.brand,
                    borderColorHover: BRAND.brandHover,
                },
                accent: {
                    background: BRAND.brand,
                    backgroundHover: BRAND.brandHover,
                    textColor: BRAND.onBrand,
                },
                flat: {
                    textColor: BRAND.textSecondary,
                    textColorHover: BRAND.brand,
                },
            },
        },
        dark: {
            base: {
                textColorBase: BRAND.text,
                textColorSecondary: BRAND.textSecondary,
                textColorLink: BRAND.brand,
                textColorSecondaryLink: BRAND.brandHover,
                bodyBackground: BRAND.surface,
                scrollBackground: "transparent",
                scrollThumbBackground: BRAND.border,
                logoBackgroundColor: "transparent",
                borderColor: BRAND.borderSubtle,
                windowBorderColor: BRAND.border,
            },
            tabs: {
                background: BRAND.surfaceMuted,
                backgroundActive: BRAND.brand,
                textColorActive: BRAND.onBrand,
            },
            list: {
                background: BRAND.surfaceMuted,
                borderColor: BRAND.border,
            },
            button: {
                icon: {
                    backgroundHover: BRAND.surfaceMuted,
                },
                primary: {
                    borderColor: BRAND.border,
                    borderColorHover: BRAND.brand,
                    backgroundHover: BRAND.surfaceMuted,
                },
                outlined: {
                    borderColor: BRAND.brand,
                    borderColorHover: BRAND.brandHover,
                },
                accent: {
                    background: BRAND.brand,
                    backgroundHover: BRAND.brandHover,
                    textColor: BRAND.onBrand,
                },
                flat: {
                    textColor: BRAND.textSecondary,
                    textColorHover: BRAND.brand,
                },
            },
        },
    },
};
