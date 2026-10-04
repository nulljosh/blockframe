package com.nulljosh.charwork

import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState

fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "Blockframe",
        state = rememberWindowState(width = 1040.dp, height = 720.dp),
    ) {
        BlockframeTheme { AppScreen() }
    }
}
