const std = @import("std");
const windows = std.os.windows;
const HWND = windows.HWND;
const BOOL = windows.BOOL;

const LPARAM = u64;

var resolved: LPARAM = 0;
var start_time: i128 = 0;

const SW_SHOWMAXIMIZED = 3;
const INPUT_KEYBOARD = 1;

const KEYEVENTF_KEYUP = 0x0002;
const KEY_F5 = 0x74; // Virtual key code for 'F5'

const WNDENUMPROC = *const fn (hWnd: ?HWND, lParam: LPARAM) BOOL;

extern "user32" fn FindWindowA(lpClassName: ?[*:0]const u8, lpWindowName: [*:0]const u8) ?HWND;
extern "user32" fn SetForegroundWindow(hWnd: ?HWND) BOOL;
extern "user32" fn ShowWindow(hWnd: ?HWND, nCmdShow: c_int) BOOL;
extern "user32" fn EnumWindows(
    lpEnumFunc: ?WNDENUMPROC,
    lParam: LPARAM,
) BOOL;
extern "user32" fn IsWindowVisible(hWnd: ?HWND) BOOL;
extern "user32" fn GetWindowTextA(hWnd: ?HWND, lpString: [*:0]u8, nMaxCount: c_int) c_int;

const INPUT = extern struct {
    type: u32,
    u: extern union {
        ki: KEYBDINPUT,
        mi: MOUSEINPUT,
    },
};

const MOUSEINPUT = extern struct {
    dx: i32,
    dy: i32,
    mouseData: u32,
    dwFlags: u32,
    time: u32,
    dwExtraInfo: usize,
};

const KEYBDINPUT = extern struct {
    wVk: u16,
    wScan: u16,
    dwFlags: u32,
    time: u32,
    dwExtraInfo: usize,
};

extern "user32" fn SendInput(nInputs: u32, pInputs: [*]const INPUT, cbSize: c_int) u32;

fn send_key_press() void {
    const inputs: [2]INPUT = [_]INPUT{
        .{
            .type = INPUT_KEYBOARD,
            .u = .{
                .ki = KEYBDINPUT{
                    .wVk = KEY_F5,
                    .wScan = 0,
                    .dwFlags = 0,
                    .time = 3,
                    .dwExtraInfo = 0,
                },
            },
        },
        .{
            .type = INPUT_KEYBOARD,
            .u = .{
                .ki = KEYBDINPUT{
                    .wVk = KEY_F5,
                    .wScan = 0,
                    .dwFlags = KEYEVENTF_KEYUP,
                    .time = 0,
                    .dwExtraInfo = 0,
                },
            },
        },
    };

    // Send the input
    _ = SendInput(@intCast(inputs.len), &inputs, @sizeOf(INPUT));
}

fn enumWindowsProc(hWnd: ?HWND, _: u64) c_int {
    var title: [256:0]u8 = undefined;

    // Get the window title
    const length = GetWindowTextA(hWnd, &title, @intCast(title.len));

    const hasRobloxStudioTitle = std.mem.indexOf(u8, &title, "- Roblox Studio") != null;

    if (length > 0 and hasRobloxStudioTitle and IsWindowVisible(hWnd) == 1 and resolved == 0) {
        resolved = 1;

        const title_slice = title[0..@intCast(length)];
        std.debug.print("Opening Roblox Window: {s}\n", .{title_slice});

        _ = SetForegroundWindow(hWnd);

        _ = ShowWindow(hWnd, SW_SHOWMAXIMIZED);

        send_key_press();

        const end_time = std.time.nanoTimestamp();
        const duration_ms = (end_time - start_time);
        std.debug.print("Duration: {} nanoseconds\n", .{duration_ms});
    }

    return 1; // Continue enumeration
}

pub fn main() void {
    start_time = std.time.nanoTimestamp();
    const lpEnumFunc: WNDENUMPROC = enumWindowsProc;
    _ = EnumWindows(lpEnumFunc, resolved);
}
