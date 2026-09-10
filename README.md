# The Brew

The Brew is an offline Expo mobile coffee companion for home baristas. It keeps coffee details, equipment preferences, recipes, guided brew timers, tasting notes, and brew history on the device.

## Highlights

- Editable coffee shelf with processing, variety, altitude, flavor, image, and color details
- Equipment-aware recipe recommendations and guided multi-stage timers
- Dose, ratio, water, timing, grinder-setting, and filter adjustments
- Ratings, tasting notes, favorites, saved recipes, and brew history
- Offline QR recipe sharing with an optional copy of the coffee used
- English and Spanish interface
- Local persistence with AsyncStorage

## Run locally

Requirements:

- Node.js
- pnpm
- Expo Go or an Android/iOS simulator

From this repository:

```bash
pnpm install
pnpm run dev
```

Then open the generated Expo QR code in Expo Go.

## Data model

The Brew is currently frontend-only. User-entered data stays in local app storage unless the user deliberately shares selected recipe and coffee data through an offline QR code.

## Legal

- [Privacy Policy](PRIVACY.md)
- [Compliance and Responsible Use](COMPLIANCE.md)

These documents describe the current product behavior. They are not legal advice or a claim of certification.