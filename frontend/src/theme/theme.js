import { ruRU } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';

// declare module '@mui/material/styles' {
//     interface Palette {
//         neutral: Palette['primary'];
//         status: { danger: string };
//     }
//     interface PaletteOptions {
//         neutral?: PaletteOptions['primary'];
//         status?: { danger: string };
//     }
//     interface CommonColors {
//         border: string;
//         buttonContainedPrimaryHover: string;
//         blue: string;
//         deepBlue: string;
//         darkGrey: string;
//         lightGrey: string;
//         green: string;
//     }
//     interface TypographyVariants {
//         // все стандартные варианты уже есть, дополнительно ничего не нужно
//     }
// }

export const constPalette = {
    common: {
        border: '#dbdcdf',
        buttonContainedPrimaryHover: '#0065b0',
        black: '#1d1d1b',
        blue: '#20a0ff',
        deepBlue: '#0065b0',
        darkGrey: '#4f5154',
        lightGrey: '#eef1f6',
        green: '#66bb6a',
    },
    tonalOffset: 0.1,
    primary: {
        main: '#20a0ff',
        contrastText: '#fff',
    },
    success: {
        main: '#46c34b',
        contrastText: '#fff',
    },
    error: {
        main: '#e74c3c',
    },
    neutral: {
        main: '#5c6ac4',
    },
};

export const typographyVariants = {
    h1: {
        fontSize: '34px',
        lineHeight: '36px',
        letterSpacing: '0',
        fontWeight: '600',
        color: constPalette.common.blue,
    }, // Figma - "H1"
    h2: {
        fontSize: '24px',
        lineHeight: '32px',
        letterSpacing: '0.18px',
        fontWeight: '400',
    }, // Figma - "H2"
    subtitle1: {
        fontSize: '20px',
        lineHeight: '24px',
        letterSpacing: '0.15px',
        fontWeight: '600',
    }, // Figma - "Title"
    subtitle2: {
        fontSize: '20px',
        lineHeight: '24px',
        letterSpacing: '0.15px',
        fontWeight: '400',
    }, // Figma - "Title reg"
    body1: {
        fontSize: '16px',
        lineHeight: '22px',
        letterSpacing: '0.5px',
        fontWeight: '400',
    }, // Figma - "Body"
    body2: {
        fontSize: '14px',
        lineHeight: '19px',
        letterSpacing: '0.25px',
        fontWeight: '400',
    }, // Figma - "Subhead"
    button: {
        fontSize: '16px',
        lineHeight: '19px',
        letterSpacing: '0.25px',
        fontWeight: '600',
        textTransform: 'initial',
    }, // Figma - "Button"
};

export const baseTheme = {
    // status — нестандартное поле, оставлено для совместимости с кодом,
    // который его читает (theme.status.danger).
    status: {
        danger: '#e53e3e',
    },

    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1490,
            xl: 1920,
        },
    },

    palette: {
        ...constPalette,
    },

    shape: {
        borderRadius: 12,
    },

    typography: {
        fontFamily: '"ProximaNova", Arial, sans-serif',
        fontSize: 16,
        htmlFontSize: 16,
        fontWeightMedium: 600,
        ...typographyVariants,
    },

    zIndex: {
        mobileStepper: 1000,
        speedDial: 1050,
        appBar: 1100,
        drawer: 1200,
        modal: 1300,
        snackbar: 1400,
        tooltip: 1500,
    },

    components: {
        MuiPagination: {
            defaultProps: {
                size: 'small',
                showFirstButton: true,
                showLastButton: true,
            },
        },
        MuiDataGrid: {
            defaultProps: {
                density: 'compact',
                paginationMode: 'server',
            },
        },
        MuiButtonBase: {
            defaultProps: {
                disableRipple: true,
            },
            styleOverrides: {
                root: {
                    '& .MuiSvgIcon-root': {
                        width: '0.9em',
                        height: '0.9em',
                    },
                },
            },
        },
        MuiSwitch: {
            defaultProps: {
                color: 'primary',
            },
            styleOverrides: {
                root: {
                    width: '36px',
                    height: '20px',
                    padding: 0,
                    display: 'flex',
                    position: 'relative',
                    alignItems: 'center',
                },
                switchBase: {
                    padding: '2px',
                    color: constPalette.common.lightGrey,
                    '&.Mui-checked': {
                        transform: 'translateX(16px)',
                        color: '#fff',
                        '& + .MuiSwitch-track': {
                            opacity: 1,
                            backgroundColor: constPalette.primary.main,
                            borderColor: constPalette.primary.main,
                        },
                    },
                    '&.Mui-focusVisible .MuiSwitch-thumb': {
                        boxShadow: '0 0 0 4px rgba(0, 0, 0, 0.25)',
                    },
                },
                thumb: {
                    width: '16px',
                    height: '16px',
                    boxShadow: 'none',
                    backgroundColor: '#fff',
                },
                track: {
                    border: `1px solid ${constPalette.common.darkGrey}`,
                    borderRadius: 10,
                    opacity: 1,
                    backgroundColor: constPalette.common.darkGrey,
                },
                colorPrimary: {
                    '&.Mui-disabled + .MuiSwitch-track': {
                        backgroundColor: '#b7b7b7',
                        borderColor: '#b7b7b7',
                    },
                },
            },
        },
        MuiTableCell: {
            defaultProps: {
                size: 'small',
                // Строки таблиц сделаем небольшими.
                // Кому в некоторых случаях потребуется высокие строки, назначат локально
            },
            styleOverrides: {
                root: {
                    ...typographyVariants.body2,
                    borderBottom: 'initial',
                    lineHeight: 1.3,
                },
                head: {
                    boxShadow: '0px 0px 3px #d2d2d2',
                    borderBottom: '1px solid rgba(32, 160, 255, 0.5)',
                    fontWeight: 600,
                },
                body: {
                    borderBottom: '1px solid rgba(32, 160, 255, 0.5)',
                },
                footer: {
                    boxShadow: '0 0 1px #909090',
                },
                sizeSmall: {
                    padding: '9px 10px',
                },
            },
        },

        MuiAutocomplete: {
            styleOverrides: {
                inputRoot: {
                    '&[class*="MuiOutlinedInput-root"]': {
                        padding: '11px 11px 10px',
                        '&[class*="MuiOutlinedInput-marginDense"]': {
                            padding: '9px',
                        },
                    },
                },
                paper: {
                    boxShadow:
                        '0px 3px 5px -1px rgb(0 0 0 / 20%), ' +
                        '0px 5px 8px 0px rgb(0 0 0 / 14%), ' +
                        '0px 1px 14px 0px rgb(0 0 0 / 12%)',
                },
            },
        },
        MuiBreadcrumbs: {
            styleOverrides: {
                root: {
                    marginLeft: 8,
                    marginBottom: '9px',
                },
                li: {
                    padding: 0,
                },
                separator: {
                    marginLeft: '9px',
                    marginRight: '9px',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    padding: '14px 30px',
                    minWidth: 'initial',
                    borderRadius: 28,
                    fontWeight: '400',
                },
                outlined: {
                    border: '1px solid ' + constPalette.common.border,
                    padding: '13px 28px',
                },
                textSizeSmall: {
                    padding: '4px 10px',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' },
                    '&:active': { boxShadow: 'none' },
                },
                containedPrimary: {
                    '&:hover': {
                        backgroundColor: constPalette.common.buttonContainedPrimaryHover,
                    },
                },
                startIcon: {
                    marginLeft: '-4px',
                    marginRight: '6px',
                    marginTop: '-1px',
                },
                endIcon: {
                    marginRight: '-5px',
                    marginLeft: '7px',
                    marginTop: '-1px',
                },
            },
        },
        // MuiChip: {
        //     styleOverrides: {
        //         root: {
        //             backgroundColor: '#e2e2e2',
        //             color: '#4a4a4a',
        //         },
        //     },
        // },

        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    padding: '32px 16px 0 16px',
                    textAlign: 'center',
                },
            },
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {
                    padding: '32px',
                },
            },
        },
        MuiDialogActions: {
            styleOverrides: {
                spacing: {
                    padding: '18px 20px',
                },
            },
        },

        MuiDivider: {
            styleOverrides: {
                root: {
                    backgroundColor: constPalette.common.blue,
                    border: '0.5px solid',
                    borderColor: constPalette.common.blue,
                    height: 0,
                },
            },
        },

        MuiFormHelperText: {
            styleOverrides: {
                root: {
                    marginTop: '6px',
                    lineHeight: '1.15',
                },
            },
        },
        MuiFormLabel: {
            styleOverrides: {
                root: {
                    ...typographyVariants.body1,
                    color: '#818181',
                },
            },
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    ...typographyVariants.body1,
                    fontWeight: '600',
                    background: '#fff',
                    '&.Mui-disabled': {
                        background: constPalette.common.lightGrey,
                        color: constPalette.common.black,
                        border: '1px solid #e5e5e5',

                        input: {
                            '-webkit-text-fill-color': constPalette.common.black,
                        }
                    },
                    '& .MuiInputBase-inputSizeSmall': {
                        paddingTop: '13.5px',
                        paddingBottom: '13.5px',
                    },
                    '& .Custom-DatePicker': {
                        //padding: '21px 15px 21px 0 !important',
                    },
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                formControl: {
                    top: -2,
                },
                outlined: {
                    '&.MuiInputLabel-marginDense': {
                        transform: 'translate(15px, 13px) scale(1)',
                    },
                    '&.MuiInputLabel-shrink': {
                        transform: 'translate(14px, -6px) scale(0.75)',
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: constPalette.common.blue,
                        },
                        '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#f0f0f0',
                        },
                        '&.Mui-disabled.Mui-error .MuiOutlinedInput-notchedOutline': {
                            borderColor: constPalette.error.main,
                        },
                    }, // цвет бордера инпута при наведении
                    '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                        borderColor: constPalette.common.lightGrey,
                    },
                    '&.Mui-disabled.Mui-error .MuiOutlinedInput-notchedOutline': {
                        borderColor: constPalette.error.main,
                    },
                },
                inputMarginDense: {
                    paddingTop: '13.5px',
                    paddingBottom: '13.5px',
                },
                adornedEnd: {
                    paddingRight: '9px',
                },
                input: {
                    padding: '18px 15px 19px',
                },
                notchedOutline: {
                    borderColor: '#61bbff',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                outlined: {
                    border: '1px solid rgba(32, 160, 255, 0.5)',
                },
                elevation1: {
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 20%)',
                },
                rounded: {
                    borderRadius: 12,
                },
            },
        },

        MuiPaginationItem: {
            styleOverrides: {
                rounded: {
                    borderRadius: 4,
                },
                sizeSmall: {
                    margin: '0 2px',
                },
            },
        },

        MuiRadio: {
            styleOverrides: {
                root: {
                    padding: '4px',
                },
            },
        },

        MuiSelect: {
            styleOverrides: {
                icon: {
                    top: 'calc(50% - 9px)',
                },
                select: {
                    minHeight: '1.1876em',
                    padding: '20px 32px 19px 15px',
                    '&:focus': {
                        borderRadius: 12,
                    },
                },
            },
        },

        MuiSlider: {
            styleOverrides: {
                root: {
                    height: '5px',
                },
                rail: {
                    height: '5px',
                    opacity: 1,
                    backgroundColor: constPalette.common.lightGrey,
                },
                track: {
                    height: '3px',
                },
                thumb: {
                    width: '15px',
                    height: '15px',
                    marginLeft: '3px',
                    marginTop: '-1px',
                },
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    ...typographyVariants.body2,
                    lineHeight: '18px',
                    padding: '8px 10px',
                    backgroundColor: constPalette.common.blue,
                    borderRadius: 7,
                },
                arrow: {
                    color: constPalette.common.blue,
                },
            },
        },

        MuiTabPanel: {
            styleOverrides: {
                root: {
                    padding: '20px',
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    display: 'none',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    ...typographyVariants.body1,
                    minHeight: '43px',
                    padding: '6px 17px',
                    minWidth: 'initial !important',
                    '&.Mui-selected': {
                        background: constPalette.primary.main,
                        fontWeight: 600,
                        color: constPalette.primary.contrastText,
                        height: '48px',
                        borderRadius: '8px 8px 0 0',
                    },
                },
            },
        },

        MuiTableContainer: {
            styleOverrides: {
                root: {
                    border: '1px solid #61bbff',
                    borderRadius: '2px 4px 4px 4px',
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    background: '#f6fbff',
                },
            },
        },
        MuiTableFooter: {
            styleOverrides: {
                root: {
                    background: '#f6fbff',
                },
            },
        },
        MuiTablePagination: {
            styleOverrides: {
                input: {
                    border: '1px solid #cecece',
                    borderRadius: 4,
                    fontWeight: '400',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                hover: {
                    '&:hover': {
                        backgroundColor: '#f8f8f8',
                        boxShadow: 'inset 0 0 4px rgba(0, 0, 0, 0.06)',
                    },
                },
            },
        },
        MuiTableSortLabel: {
            styleOverrides: {
                icon: {
                    opacity: 1,
                    color: '#e0e0e0',
                    transition:
                        'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, ' +
                        'transform 750ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                },
                iconDirectionAsc: {
                    transform: 'rotate(-90deg)',
                    fontSize: '1.5rem !important',
                },
                iconDirectionDesc: {
                    transform: 'rotate(90deg)',
                    fontSize: '1.5rem !important',
                },
            },
        },

        MuiMenuItem: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.12)',
                        },
                        '&.Mui-focusVisible': {
                            backgroundColor: 'rgba(0, 0, 0, 0.14)',
                        },
                    },
                },
            },
        },
    },
};

export const lightTheme = createTheme(
    {
        ...baseTheme,
        palette: {
            ...baseTheme.palette,
            mode: 'light',
            primary: {
                main: constPalette.common.blue,
                contrastText: '#fff',
            },
            secondary: {
                main: '#fb8c00',
            },
            text: {
                primary: '#1d1d1b',
            },
            background: {
                default: '#f3f9ff',
                paper: '#fff',
            },
        },
    },
    ruRU
);

// Некоторые варианты дефолтных 25-ти теней используются компонентами MUI,
// поэтому важно, чтобы они присутствовали в итоговом объекте темы.
// createTheme() их уже сгенерировал, дополнительно добавляем «бумажную» тень.
lightTheme.shadows.paper = '0 5px 15px rgba(0, 0, 0, .1), 0 4px 6px rgba(0, 0, 0, .05)';

export const darkTheme = createTheme(
    {
        ...baseTheme,
        palette: {
            ...baseTheme.palette,
            mode: 'dark',
            primary: {
                main: constPalette.common.blue,
                contrastText: '#fff',
            },
            secondary: {
                main: '#F5A162',
            },
            background: {
                default: '#303030',
                paper: '#424242',
            },
        },
        components: {
            ...baseTheme.components,
            MuiFormLabel: {
                ...baseTheme.components.MuiFormLabel,
                styleOverrides: {
                    ...baseTheme.components.MuiFormLabel.styleOverrides,
                    root: {
                        ...baseTheme.components.MuiFormLabel.styleOverrides.root,
                        color: constPalette.common.lightGrey,
                    },
                },
            },
            MuiInputBase: {
                ...baseTheme.components.MuiInputBase,
                styleOverrides: {
                    ...baseTheme.components.MuiInputBase.styleOverrides,
                    root: {
                        ...baseTheme.components.MuiInputBase.styleOverrides.root,
                        background: '#424242',
                    },
                },
            },
            MuiTableHead: {
                ...baseTheme.components.MuiTableHead,
                styleOverrides: {
                    root: { background: '#505050' },
                },
            },
            MuiTableFooter: {
                ...baseTheme.components.MuiTableFooter,
                styleOverrides: {
                    root: { background: '#505050' },
                },
            },
        },
    },
    ruRU
);
