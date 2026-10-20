// Shared SVG symbols: faction pennants, card stat icons and medallion glyphs.
// Drawn once (see <SvgDefs />) and referenced with <use href="#id" />.

export const SVG_DEFS = `<linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1B8"/><stop offset="0.45" stop-color="#D9A93E"/><stop offset="1" stop-color="#8A5E14"/></linearGradient>
<linearGradient id="goldD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4C4"/><stop offset="0.4" stop-color="#E2B44E"/><stop offset="0.75" stop-color="#A8761E"/><stop offset="1" stop-color="#F0CF78"/></linearGradient>
<linearGradient id="dawnCloth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0C3320"/><stop offset="0.5" stop-color="#1F6039"/><stop offset="1" stop-color="#0C3320"/></linearGradient>
<linearGradient id="hordeCloth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A070B"/><stop offset="0.5" stop-color="#9A1A1E"/><stop offset="1" stop-color="#4A070B"/></linearGradient>
<linearGradient id="neutralCloth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0B2341"/><stop offset="0.5" stop-color="#1F5490"/><stop offset="1" stop-color="#0B2341"/></linearGradient>
<linearGradient id="bone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF1D6"/><stop offset="1" stop-color="#BFA77A"/></linearGradient>
<linearGradient id="silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F8FB"/><stop offset="0.5" stop-color="#A9B6C2"/><stop offset="1" stop-color="#5D6B78"/></linearGradient>
<linearGradient id="boltG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6C2"/><stop offset="0.35" stop-color="#FFD240"/><stop offset="0.8" stop-color="#E08A10"/><stop offset="1" stop-color="#B05A08"/></linearGradient>
<g id="pDawn">
<path d="M5 6H55V86L30 102 5 86Z" fill="url(#dawnCloth)" stroke="#20140A" stroke-width="3.2"/>
<path d="M5 6H55V86L30 102 5 86Z" fill="none" stroke="url(#goldV)" stroke-width="2"/>
<path d="M10.5 11H49.5V83L30 95.5 10.5 83Z" fill="none" stroke="#D9A93E" stroke-width="0.9" opacity="0.75"/>
<circle cx="30" cy="45" r="21" fill="#082416" fill-opacity="0.45" stroke="url(#goldD)" stroke-width="1.8"/>
<circle cx="30" cy="45" r="18.6" fill="none" stroke="#D9A93E" stroke-width="0.6" opacity="0.7"/>
<g fill="none" stroke="url(#goldD)" stroke-linecap="round">
<path d="M30 49C26 46 22.5 44 19.5 43M30 49C34 46 37.5 44 40.5 43M30 46C28 41 25.5 37 23 34.5M30 46C32 41 34.5 37 37 34.5M30 47V32" stroke-width="1.5"/>
<path d="M30 61C27 62.3 24 63 20.5 62.6M30 61C33 62.3 36 63 39.5 62.6M30 61.5C28.5 63.5 27 64.5 25 65M30 61.5C31.5 63.5 33 64.5 35 65" stroke-width="1.4"/>
</g>
<path d="M27.4 62C28.4 57 28.8 52 28.8 46.5H31.2C31.2 52 31.6 57 32.6 62Z" fill="url(#goldD)" stroke="#3A2506" stroke-width="0.4"/>
<g fill="url(#goldD)" stroke="#3A2506" stroke-width="0.4"><ellipse cx="17.9" cy="37.8" rx="2.6" ry="4" transform="rotate(285 17.9 37.8)"/><ellipse cx="19.8" cy="33.8" rx="2.6" ry="4" transform="rotate(305 19.8 33.8)"/><ellipse cx="22.8" cy="30.8" rx="2.6" ry="4" transform="rotate(325 22.8 30.8)"/><ellipse cx="26.8" cy="28.9" rx="2.6" ry="4" transform="rotate(345 26.8 28.9)"/><ellipse cx="30.0" cy="28.5" rx="2.6" ry="4" transform="rotate(360 30.0 28.5)"/><ellipse cx="33.2" cy="28.9" rx="2.6" ry="4" transform="rotate(375 33.2 28.9)"/><ellipse cx="37.2" cy="30.8" rx="2.6" ry="4" transform="rotate(395 37.2 30.8)"/><ellipse cx="40.2" cy="33.8" rx="2.6" ry="4" transform="rotate(415 40.2 33.8)"/><ellipse cx="42.1" cy="37.8" rx="2.6" ry="4" transform="rotate(435 42.1 37.8)"/><ellipse cx="23.9" cy="36.7" rx="2.1" ry="3.2" transform="rotate(305 23.9 36.7)"/><ellipse cx="27.4" cy="34.0" rx="2.1" ry="3.2" transform="rotate(340 27.4 34.0)"/><ellipse cx="32.6" cy="34.0" rx="2.1" ry="3.2" transform="rotate(380 32.6 34.0)"/><ellipse cx="36.1" cy="36.7" rx="2.1" ry="3.2" transform="rotate(415 36.1 36.7)"/></g>
<path d="M30 17l3.4 4.3-3.4 4.3-3.4-4.3z" fill="#9EE4FF" stroke="#0E3D63" stroke-width="0.8"/>
<path d="M30 79l3 3.8-3 3.8-3-3.8z" fill="#9EE4FF" stroke="#0E3D63" stroke-width="0.8"/>
<rect x="1" y="1" width="58" height="7" rx="3.5" fill="url(#goldV)" stroke="#20140A" stroke-width="1.2"/>
</g>
<g id="pHorde">
<path d="M5 6H55V84L46.5 97 38.5 86 30 101 21.5 86 13.5 97 5 84Z" fill="url(#hordeCloth)" stroke="#140808" stroke-width="3.4"/>
<path d="M5 6H55V84L46.5 97 38.5 86 30 101 21.5 86 13.5 97 5 84Z" fill="none" stroke="url(#goldV)" stroke-width="1.6"/>
<path d="M10.5 11H49.5V80" fill="none" stroke="#D9A93E" stroke-width="0.8" opacity="0.6"/><path d="M10.5 11V80" fill="none" stroke="#D9A93E" stroke-width="0.8" opacity="0.6"/>
<path d="M13 21C9 34 15.5 45 25 45.5L24.2 41C19 40 15 34 16.5 25Z" fill="url(#bone)" stroke="#2A0A06" stroke-width="0.9"/>
<path d="M47 21C51 34 44.5 45 35 45.5L35.8 41C41 40 45 34 43.5 25Z" fill="url(#bone)" stroke="#2A0A06" stroke-width="0.9"/>
<path d="M30 33C22.5 33 19.5 39 19.5 45.5c0 5 2.6 8 4.6 9V61h11.8v-6.5c2-1 4.6-4 4.6-9C40.5 39 37.5 33 30 33Z" fill="url(#bone)" stroke="#2A0A06" stroke-width="1"/>
<ellipse cx="25.6" cy="45.5" rx="3.3" ry="2.6" fill="#FF5A2A" stroke="#2A0A06" stroke-width="0.9"/>
<ellipse cx="34.4" cy="45.5" rx="3.3" ry="2.6" fill="#FF5A2A" stroke="#2A0A06" stroke-width="0.9"/>
<path d="M30 49.2l-1.7 3.4h3.4z" fill="#2A0A06"/>
<path d="M27 56.5V61M30 56.5V61M33 56.5V61" stroke="#2A0A06" stroke-width="1"/>
<path d="M30 18l2.8 4-2.8 9-2.8-9z" fill="url(#bone)" stroke="#2A0A06" stroke-width="0.8"/>
<path d="M30 70l4 5-4 5-4-5z" fill="#FF5A4E" stroke="#2A0A06" stroke-width="0.8"/>
<rect x="1" y="1" width="58" height="7" rx="2" fill="#3A302A" stroke="#140808" stroke-width="1.2"/><rect x="3" y="2.5" width="54" height="1.6" fill="#8A7A6A"/>
</g>
<g id="pNeutral">
<path d="M5 6H55V84Q55 98 30 103Q5 98 5 84Z" fill="url(#neutralCloth)" stroke="#0A1424" stroke-width="3.2"/>
<path d="M5 6H55V84Q55 98 30 103Q5 98 5 84Z" fill="none" stroke="url(#silver)" stroke-width="2"/>
<path d="M10.5 11H49.5V82Q49.5 92 30 96.5Q10.5 92 10.5 82Z" fill="none" stroke="#C9D3DA" stroke-width="0.8" opacity="0.6"/>
<circle cx="30" cy="45" r="21" fill="#071A30" fill-opacity="0.45" stroke="url(#goldD)" stroke-width="1.8"/>
<circle cx="30" cy="45" r="18.6" fill="none" stroke="#D9A93E" stroke-width="0.6" opacity="0.7"/>
<g fill="url(#goldD)" stroke="#3A2506" stroke-width="0.7" stroke-linejoin="round">
<g transform="rotate(-24 19 50)"><path d="M19 37L23 42V55L19 60 15 55V42Z"/><path d="M19 37V60M15 42h8" fill="none"/></g>
<g transform="rotate(24 41 50)"><path d="M41 37L45 42V55L41 60 37 55V42Z"/><path d="M41 37V60M37 42h8" fill="none"/></g>
<path d="M30 24L36.5 32V53L30 63 23.5 53V32Z"/>
</g>
<g fill="none" stroke="#3A2506" stroke-width="0.8" stroke-linejoin="round" opacity="0.9">
<path d="M30 24V63M23.5 32H36.5M23.5 53H36.5M30 32L23.5 53M30 32L36.5 53"/>
</g>
<path d="M26 33.5v12" stroke="#FFF6D0" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
<rect x="1" y="1" width="58" height="7" rx="3.5" fill="url(#silver)" stroke="#0A1424" stroke-width="1.2"/>
</g>
<g id="bolt">
<path d="M33 2L9 34h15L17 62 47 24H31Z" fill="url(#boltG)" stroke="#5A2A04" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M30.5 6.5L14.5 29.5h7" fill="none" stroke="#FFFBE0" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
</g>
<radialGradient id="hrtG" cx="0.36" cy="0.32" r="0.8"><stop offset="0" stop-color="#FF8A7A"/><stop offset="0.28" stop-color="#E8303A"/><stop offset="0.7" stop-color="#A80E1C"/><stop offset="1" stop-color="#5E0610"/></radialGradient>
<linearGradient id="hrtRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1B8"/><stop offset="0.5" stop-color="#C99A3C"/><stop offset="1" stop-color="#6E4A0E"/></linearGradient>
<linearGradient id="bladeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9D2DC"/></linearGradient>
<linearGradient id="bladeD" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9AA6B4"/><stop offset="1" stop-color="#5E6A78"/></linearGradient>
<linearGradient id="guardG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0B0"/><stop offset="0.5" stop-color="#D9A540"/><stop offset="1" stop-color="#8A5E14"/></linearGradient>
<linearGradient id="gripG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A4A22"/><stop offset="1" stop-color="#3A1E0C"/></linearGradient>
<linearGradient id="boltA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7C8"/><stop offset="0.5" stop-color="#FFD84A"/><stop offset="1" stop-color="#F2A81C"/></linearGradient>
<linearGradient id="boltB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6B42A"/><stop offset="1" stop-color="#B8620A"/></linearGradient>
<g id="iHeart">
<path d="M32 57C30 55 6 41 4.6 24.6 3.6 13.4 11.6 6 20.6 6c5.4 0 9.2 2.8 11.4 6.6C34.2 8.8 38 6 43.4 6c9 0 17 7.4 16 18.6C58 41 34 55 32 57z" fill="#3A2614"/>
<path d="M32 50.5C29.8 48.6 11.6 37.6 10.6 24.2 10 16.6 15 11.6 21 11.6c4.6 0 7.6 2.8 9.6 6.8" fill="none" stroke="#E9DCB8" stroke-width="1.6" stroke-linecap="round"/>
<path d="M15.6 20.6c1.2-3 4-4.6 7-4.2" fill="none" stroke="#E9DCB8" stroke-width="2.4" stroke-linecap="round"/>
</g>
<g id="iSword">
<path d="M32 1L36.4 9V41H27.6V9Z" fill="#3A2614"/>
<path d="M32 6V38" stroke="#E9DCB8" stroke-width="1.2" stroke-linecap="round"/>
<path d="M20.5 41.2c3-1.6 20-1.6 23 0 1.6.9 1.6 3.1 0 4-3 1.6-20 1.6-23 0-1.6-.9-1.6-3.1 0-4z" fill="#3A2614"/>
<circle cx="19.8" cy="43.2" r="2.8" fill="#3A2614"/><circle cx="44.2" cy="43.2" r="2.8" fill="#3A2614"/>
<rect x="29.3" y="45" width="5.4" height="10.4" rx="1.4" fill="#3A2614"/>
<path d="M29.6 48.4h4.8M29.6 51.6h4.8" stroke="#E9DCB8" stroke-width="0.9"/>
<circle cx="32" cy="58.2" r="3.6" fill="#3A2614"/>
</g>
<g id="iSwords">
<g transform="translate(32 33) scale(0.9) rotate(-40) translate(-32 -24)"><use href="#iSword"/></g>
<g transform="translate(32 33) scale(0.9) rotate(40) translate(-32 -24)"><use href="#iSword"/></g>
</g>
<g id="iBolt">
<path d="M38 2L12 36h15L20 62 52 24H36L44 2Z" fill="#3A2614" stroke="#3A2614" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M38.5 7L18.5 33" stroke="#E9DCB8" stroke-width="1.8" stroke-linecap="round"/>
<path d="M33 30L26 53" stroke="#E9DCB8" stroke-width="1.4" stroke-linecap="round"/>
</g>
<linearGradient id="mRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4C4"/><stop offset="0.35" stop-color="#E2B04A"/><stop offset="0.7" stop-color="#8E6214"/><stop offset="1" stop-color="#F0CF78"/></linearGradient>
<radialGradient id="mGreen" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#3E8A55"/><stop offset="1" stop-color="#0E2E1A"/></radialGradient>
<radialGradient id="mBrown" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#8A5A2E"/><stop offset="1" stop-color="#3A2010"/></radialGradient>
<radialGradient id="mBlue" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#3A78B8"/><stop offset="1" stop-color="#0C2442"/></radialGradient>
<radialGradient id="mRed" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#B0302E"/><stop offset="1" stop-color="#4A0A0C"/></radialGradient>
<radialGradient id="mPurple" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#6A4A8E"/><stop offset="1" stop-color="#24133A"/></radialGradient>
<g id="gHourglass"><path d="M13 9h14M13 31h14M14.5 9c0 6 11 6 11 11s-11 5-11 11M25.5 9c0 6-11 6-11 11s11 5 11 11" fill="none" stroke="#F6EBD0" stroke-width="2.2" stroke-linecap="round"/><path d="M16.5 28.5c1-2.5 6-2.5 7 0z" fill="#F2C860"/></g>
<g id="gChest"><path d="M10 19h20v11H10z" fill="#F6EBD0"/><path d="M10 19c0-5 4.5-8 10-8s10 3 10 8z" fill="#E9D7AE"/><path d="M10 19h20" stroke="#4A2A10" stroke-width="1.4"/><rect x="18" y="17" width="4" height="6" rx="1" fill="#C99A3C" stroke="#4A2A10" stroke-width="0.8"/></g>
<g id="gFlag"><path d="M13 31V9" stroke="#F6EBD0" stroke-width="2.4" stroke-linecap="round"/><path d="M14 10h14l-4 5 4 5H14z" fill="#F6EBD0"/></g>
<g id="gScroll"><path d="M12 11h14a3 3 0 0 1 0 6v13a3 3 0 0 1-3 3H11a3 3 0 0 1 0-6V14a3 3 0 0 1 1-3z" fill="#F6EBD0"/><path d="M15 18h8M15 22h8M15 26h6" stroke="#6A4A2A" stroke-width="1.4" stroke-linecap="round"/></g>
<g id="gGear"><circle cx="20" cy="20" r="6.5" fill="none" stroke="#F6EBD0" stroke-width="3"/><path d="M20 9v4M20 27v4M9 20h4M27 20h4M12.2 12.2l2.8 2.8M25 25l2.8 2.8M12.2 27.8l2.8-2.8M25 15l2.8-2.8" stroke="#F6EBD0" stroke-width="3" stroke-linecap="round"/></g>
<g id="gHelm"><path d="M11 24c0-7 4-12 9-12s9 5 9 12v5h-6v-5h-6v5h-6z" fill="#F6EBD0"/><path d="M20 12V8" stroke="#F6EBD0" stroke-width="2.4" stroke-linecap="round"/><path d="M17 24h6" stroke="#4A2A10" stroke-width="1.4"/></g>
<g id="gBoot"><path d="M14 9h9v13l7 4v5H12v-6z" fill="#F6EBD0"/></g>
<g id="gBow"><path d="M12 9c10 1 18 9 19 19" fill="none" stroke="#F6EBD0" stroke-width="2.4" stroke-linecap="round"/><path d="M12 9l19 19M9 31l12-12M21 19l-4.5.5M21 19l-.5 4.5" stroke="#F6EBD0" stroke-width="1.8" stroke-linecap="round"/></g>
<g id="gShield"><path d="M20 9l9 3v7c0 6-4 10-9 12-5-2-9-6-9-12v-7z" fill="#F6EBD0"/><path d="M20 12v16" stroke="#4A2A10" stroke-width="1.2"/></g>
<g id="gSwords"><path d="M11 11l14 14M29 11L15 25" stroke="#F6EBD0" stroke-width="2.6" stroke-linecap="round"/><path d="M22 27l5-5M13 22l5 5" stroke="#F2C860" stroke-width="2.4" stroke-linecap="round"/></g><g id="gWing"><path d="M9 30C11 20 18 13 31 11c-2 4-5 6.5-10 8 3.6.3 6.4 0 9-1.2-2.4 3.6-6.6 5.8-11.4 6.3 2.4 1 4.6 1.1 7 .7-3.6 3.3-9 5-16.6 5.2z" fill="#F6EBD0"/></g>
<g id="gSword"><path d="M28 9l-11 11" stroke="#F6EBD0" stroke-width="3" stroke-linecap="round"/><path d="M28 9h-4M28 9v4" stroke="#F6EBD0" stroke-width="2.4" stroke-linecap="round"/><path d="M13 17l7 7" stroke="#F2C860" stroke-width="2.8" stroke-linecap="round"/><path d="M15.5 24.5L11 29" stroke="#F6EBD0" stroke-width="3" stroke-linecap="round"/></g>
<g id="gStar"><path d="M20 8l3.2 8.2L32 17l-6.8 5.4L27.4 31 20 26.2 12.6 31l2.2-8.6L8 17l8.8-.8z" fill="#F2C860" stroke="#5A3A0A" stroke-width="0.8"/></g>
<g id="gCrystal"><path d="M20 7l7 9-3 16h-8l-3-16z" fill="#BDEBFF" stroke="#0C2C52" stroke-width="1"/><path d="M20 7l-7 9h7z" fill="#FFFFFF"/></g>
<g id="gHeartG"><path d="M20 31s-10-6-11.4-12.4C7.6 13.8 11 10 15 10c2.4 0 4 1.4 5 3.2 1-1.8 2.6-3.2 5-3.2 4 0 7.4 3.8 6.4 8.6C30 25 20 31 20 31z" fill="#F6EBD0"/></g>
<linearGradient id="oGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4C4"/><stop offset="0.3" stop-color="#E9B94F"/><stop offset="0.62" stop-color="#9A6A18"/><stop offset="1" stop-color="#F2CF72"/></linearGradient>
<linearGradient id="oGoldV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1B8"/><stop offset="0.45" stop-color="#D9A540"/><stop offset="1" stop-color="#7A520E"/></linearGradient>
<linearGradient id="oGem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2FCFF"/><stop offset="0.35" stop-color="#7FD3FF"/><stop offset="1" stop-color="#174A86"/></linearGradient>
<linearGradient id="oGemDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5AB4EE"/><stop offset="1" stop-color="#0E2F5E"/></linearGradient>
<g id="ornCorner">
<path d="M8 38V8H38" fill="none" stroke="#1E1204" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 38V8H38" fill="none" stroke="url(#oGoldV)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 3.5L12.5 8 8 12.5 3.5 8Z" fill="url(#oGold)" stroke="#1E1204" stroke-width="1.2" stroke-linejoin="round"/>
</g>
<g id="ornCrest">
<path d="M70 38L78 50 70 62 62 50Z" fill="url(#oGold)" stroke="#1E1204" stroke-width="1.3" stroke-linejoin="round"/>
<path d="M70 42.5L74.5 50 70 57.5 65.5 50Z" fill="url(#oGem)" stroke="#0C2C52" stroke-width="0.8"/>
<path d="M70 42.5L65.5 50H70Z" fill="#FFFFFF" opacity="0.6"/>
</g>
<linearGradient id="ribShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.15"/><stop offset="0.75" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></linearGradient>
<radialGradient id="stBuff" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#3E8A55"/><stop offset="1" stop-color="#0C2A16"/></radialGradient>
<radialGradient id="stDebuff" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#8E2A2E"/><stop offset="1" stop-color="#2E0608"/></radialGradient>
<g id="sWeb" fill="none" stroke="#F6EBD0" stroke-width="1.6" stroke-linecap="round"><path d="M20 9v22M9 20h22M12.2 12.2l15.6 15.6M27.8 12.2L12.2 27.8"/><path d="M20 14.5l4 1.6 1.6 3.9-1.6 4-4 1.6-3.9-1.6-1.6-4 1.6-3.9z"/></g>
<g id="sRoot" fill="none" stroke="#F6EBD0" stroke-width="2" stroke-linecap="round"><path d="M20 9v9M20 18c-2 4-6 5-9 6M20 18c2 4 6 5 9 6M20 18v6M20 24c-1.5 2.5-2.5 4.5-2.5 7M20 24c1.5 2.5 2.5 4.5 2.5 7"/></g>
<g id="sSkull"><path d="M20 10c-5.6 0-9 3.6-9 8.4 0 3 1.4 5 3.2 6V28h11.6v-3.6c1.8-1 3.2-3 3.2-6C29 13.6 25.6 10 20 10z" fill="#F6EBD0"/><circle cx="16.4" cy="18.6" r="2.3" fill="#3A0A0C"/><circle cx="23.6" cy="18.6" r="2.3" fill="#3A0A0C"/><path d="M18 26.5v1.5M20 26.5v1.5M22 26.5v1.5" stroke="#3A0A0C" stroke-width="1.1"/></g>
<g id="sBlade"><path d="M27.5 9.5l-11 11" stroke="#F6EBD0" stroke-width="3" stroke-linecap="round"/><path d="M12.5 19.5l8 8" stroke="#F2C860" stroke-width="2.6" stroke-linecap="round"/><path d="M14.5 25.5L10.5 29.5" stroke="#F6EBD0" stroke-width="3" stroke-linecap="round"/></g>
<g id="sBoltG"><path d="M22 8.5L13 21h6l-2.4 10.5L27 18h-6.2z" fill="#F6EBD0"/></g>
<g id="sGuard"><path d="M20 9.5l8.5 3v6.6c0 5.6-3.8 9.2-8.5 11.4-4.7-2.2-8.5-5.8-8.5-11.4v-6.6z" fill="#F6EBD0"/><path d="M20 12.8v14.4M14.6 17.8h10.8" stroke="#1E1204" stroke-width="1.4" opacity="0.55"/></g>
<g id="sStone"><path d="M20 10l8 6-3 13H15l-3-13z" fill="#F6EBD0"/><path d="M20 10l-8 6h16zM15 29l5-13 5 13" fill="none" stroke="#1E1204" stroke-width="1" opacity="0.5"/></g>`;
