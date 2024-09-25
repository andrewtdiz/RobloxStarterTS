const std = @import("std");
const windows = std.os.windows;
const HWND = windows.HWND;
const BOOL = windows.BOOL;

const SW_RESTORE = 9;

const SW_SHOWMAXIMIZED = 3;
const INPUT_KEYBOARD = 1;
const INPUT_MOUSE = 0; // Added
const KEYEVENTF_KEYUP = 0x0002;
const MOUSEEVENTF_LEFTDOWN = 0x0002; // Added
const MOUSEEVENTF_LEFTUP = 0x0004; // Added

const KEY_W = 0x57; // Virtual key code for 'W'
const KEY_T = 0x54; // Virtual key code for 'T'
const KEY_CONTROL = 0x11; // Virtual key code for 'Ctrl'
const KEY_F5 = 0x74; // Virtual key code for 'F5'

extern "user32" fn FindWindowA(lpClassName: ?[*:0]const u8, lpWindowName: [*:0]const u8) ?HWND;
extern "user32" fn SetForegroundWindow(hWnd: ?HWND) BOOL;
extern "user32" fn ShowWindow(hWnd: ?HWND, nCmdShow: c_int) BOOL;

const INPUT = extern struct {
    type: u32,
    u: extern union {
        ki: KEYBDINPUT,
        mi: MOUSEINPUT,
    },
};

const KEYBDINPUT = extern struct {
    wVk: u16,
    wScan: u16,
    dwFlags: u32,
    time: u32,
    dwExtraInfo: usize,
};

const MOUSEINPUT = extern struct {
    dx: i32,
    dy: i32,
    mouseData: u32,
    dwFlags: u32,
    time: u32,
    dwExtraInfo: usize,
};

extern "user32" fn SendInput(nInputs: u32, pInputs: [*]const INPUT, cbSize: c_int) u32;

fn send_key_press(key: u16) void {
    var inputs: [2]INPUT = undefined;

    // Key down event
    inputs[0] = INPUT{
        .type = INPUT_KEYBOARD,
        .u = .{
            .ki = KEYBDINPUT{
                .wVk = key,
                .wScan = 0,
                .dwFlags = 0,
                .time = 3,
                .dwExtraInfo = 0,
            },
        },
    };

    // Key up event
    inputs[1] = INPUT{
        .type = INPUT_KEYBOARD,
        .u = .{
            .ki = KEYBDINPUT{
                .wVk = key,
                .wScan = 0,
                .dwFlags = KEYEVENTF_KEYUP,
                .time = 0,
                .dwExtraInfo = 0,
            },
        },
    };

    // Send the input
    _ = SendInput(@intCast(inputs.len), &inputs, @sizeOf(INPUT));
}

fn find_window_by_title(window_title: []const u8) ?HWND {
    const c_window_title = @as([*:0]const u8, @ptrCast(window_title));
    return FindWindowA(null, c_window_title);
}

fn switch_to_window(window_title: []const u8) void {
    const hwnd = find_window_by_title(window_title);
    if (hwnd) |h| {
        _ = SetForegroundWindow(h);
        _ = ShowWindow(h, 8);
        _ = ShowWindow(h, SW_SHOWMAXIMIZED);
    } else {
        std.debug.print("Window not found: {s}\n", .{window_title});
    }
}

fn send_mouse_click() void {
    var inputs: [2]INPUT = undefined;

    // Mouse button down event
    inputs[0] = INPUT{
        .type = INPUT_MOUSE, // Changed from KEYEVENTF_KEYUP to INPUT_MOUSE
        .u = .{
            .mi = MOUSEINPUT{
                .dx = 0,
                .dy = 0,
                .mouseData = 0,
                .dwFlags = MOUSEEVENTF_LEFTDOWN,
                .time = 0,
                .dwExtraInfo = 0,
            },
        },
    };

    // Mouse button up event
    inputs[1] = INPUT{
        .type = INPUT_MOUSE, // Changed from KEYEVENTF_KEYUP to INPUT_MOUSE
        .u = .{
            .mi = MOUSEINPUT{
                .dx = 0,
                .dy = 0,
                .mouseData = 0,
                .dwFlags = MOUSEEVENTF_LEFTUP,
                .time = 0,
                .dwExtraInfo = 0,
            },
        },
    };

    // Send the input
    _ = SendInput(@intCast(inputs.len), &inputs, @sizeOf(INPUT));
}

fn send_key_combination(keys: []const u16) void {
    var inputs = std.ArrayList(INPUT).init(std.heap.page_allocator);
    defer inputs.deinit();

    // Key down events
    for (keys) |key| {
        inputs.append(INPUT{
            .type = INPUT_KEYBOARD,
            .u = .{
                .ki = KEYBDINPUT{
                    .wVk = key,
                    .wScan = 0,
                    .dwFlags = 0,
                    .time = 0,
                    .dwExtraInfo = 0,
                },
            },
        }) catch unreachable;
    }

    // Key up events
    for (keys) |key| {
        inputs.append(INPUT{
            .type = INPUT_KEYBOARD,
            .u = .{
                .ki = KEYBDINPUT{
                    .wVk = key,
                    .wScan = 0,
                    .dwFlags = KEYEVENTF_KEYUP,
                    .time = 0,
                    .dwExtraInfo = 0,
                },
            },
        }) catch unreachable;
    }

    // Send the input
    _ = SendInput(@intCast(inputs.items.len), inputs.items.ptr, @sizeOf(INPUT));
}

pub fn main() void {
    const window_title = "Place1 - Roblox Studio";
    switch_to_window(window_title);
    send_mouse_click();
    send_key_press(KEY_F5);
}
