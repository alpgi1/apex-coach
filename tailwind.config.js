/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            fontFamily: {
                'outfit': ['Outfit_400Regular'],
                'outfit-light': ['Outfit_300Light'],
                'outfit-medium': ['Outfit_500Medium'],
                'outfit-semibold': ['Outfit_600SemiBold'],
                'outfit-bold': ['Outfit_700Bold'],
            },
        },
    },
    plugins: [],
};
