// Neutral tokens: gray ground, white card, ink text, terracotta accent. No tan or sand.

import SwiftUI

enum Theme {
    static let background = Color(red: 0.949, green: 0.949, blue: 0.949) // #F2F2F2 ground
    static let canvas = Color(red: 0.992, green: 0.992, blue: 0.992)     // #FDFDFD card
    static let accent = Color(red: 0.851, green: 0.467, blue: 0.341)     // #D97757 terracotta
    static let ink = Color(red: 0.098, green: 0.098, blue: 0.098)        // #191919
    static let muted = Color(red: 0.42, green: 0.42, blue: 0.42)
    static let rule = Color(red: 0.86, green: 0.86, blue: 0.86)
    static let radius: CGFloat = 10
}
