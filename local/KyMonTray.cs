using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

internal static class NativeMethods
{
    internal const int SW_HIDE = 0;
    internal const int SW_RESTORE = 9;

    internal enum CtrlType
    {
        CtrlC = 0,
        CtrlBreak = 1,
        Close = 2,
        Logoff = 5,
        Shutdown = 6
    }

    internal delegate bool ConsoleCtrlHandler(CtrlType signal);

    [DllImport("kernel32.dll")]
    internal static extern IntPtr GetConsoleWindow();

    [DllImport("kernel32.dll")]
    internal static extern bool SetConsoleCtrlHandler(ConsoleCtrlHandler handler, bool add);

    [DllImport("user32.dll")]
    internal static extern bool DestroyIcon(IntPtr icon);

    [DllImport("user32.dll")]
    internal static extern bool IsIconic(IntPtr window);

    [DllImport("user32.dll")]
    internal static extern bool IsWindowVisible(IntPtr window);

    [DllImport("user32.dll")]
    internal static extern bool SetForegroundWindow(IntPtr window);

    [DllImport("user32.dll")]
    internal static extern bool ShowWindow(IntPtr window, int command);
}

internal static class TrayIconFactory
{
    internal static Icon Create()
    {
        Bitmap bitmap = new Bitmap(64, 64, PixelFormat.Format32bppArgb);
        using (Graphics graphics = Graphics.FromImage(bitmap))
        using (SolidBrush background = new SolidBrush(Color.White))
        using (SolidBrush dark = new SolidBrush(Color.FromArgb(255, 8, 29, 31)))
        using (Pen darkFrame = new Pen(Color.FromArgb(255, 8, 29, 31), 5.0f))
        using (Pen goldFrame = new Pen(Color.FromArgb(255, 244, 190, 54), 2.0f))
        using (Pen trigramPen = new Pen(Color.FromArgb(255, 8, 29, 31), 3.0f))
        using (Pen yinOutline = new Pen(Color.FromArgb(255, 8, 29, 31), 2.5f))
        using (Pen signalShadow = new Pen(Color.FromArgb(255, 8, 29, 31), 7.0f))
        using (Pen signal = new Pen(Color.FromArgb(255, 49, 211, 190), 4.0f))
        {
            graphics.SmoothingMode = SmoothingMode.AntiAlias;
            graphics.Clear(Color.Transparent);

            PointF[] octagon = new PointF[] {
                new PointF(18, 3), new PointF(43, 3), new PointF(58, 18), new PointF(58, 43),
                new PointF(43, 58), new PointF(18, 58), new PointF(3, 43), new PointF(3, 18)
            };
            graphics.FillPolygon(background, octagon);
            graphics.DrawPolygon(darkFrame, octagon);
            graphics.DrawPolygon(goldFrame, octagon);

            for (int index = 0; index < 8; index++)
            {
                double angle = index * Math.PI / 4.0;
                float x1 = 30.5f + (float)Math.Cos(angle) * 23.0f;
                float y1 = 30.5f + (float)Math.Sin(angle) * 23.0f;
                float x2 = 30.5f + (float)Math.Cos(angle) * 27.0f;
                float y2 = 30.5f + (float)Math.Sin(angle) * 27.0f;
                graphics.DrawLine(trigramPen, x1, y1, x2, y2);
            }

            graphics.FillEllipse(background, 14, 14, 33, 33);
            graphics.FillPie(dark, 14, 14, 33, 33, 90, 180);
            graphics.FillEllipse(dark, 22.25f, 14, 16.5f, 16.5f);
            graphics.FillEllipse(background, 22.25f, 30.5f, 16.5f, 16.5f);
            graphics.FillEllipse(background, 27.5f, 19.25f, 6, 6);
            graphics.FillEllipse(dark, 27.5f, 35.75f, 6, 6);
            graphics.DrawEllipse(yinOutline, 14, 14, 33, 33);

            DrawSignalBar(graphics, signalShadow, signal, 47, 51, 57);
            DrawSignalBar(graphics, signalShadow, signal, 53, 44, 57);
            DrawSignalBar(graphics, signalShadow, signal, 59, 36, 57);
        }

        IntPtr handle = bitmap.GetHicon();
        try
        {
            return (Icon)Icon.FromHandle(handle).Clone();
        }
        finally
        {
            NativeMethods.DestroyIcon(handle);
            bitmap.Dispose();
        }
    }

    private static void DrawSignalBar(Graphics graphics, Pen shadow, Pen signal, float x, float top, float bottom)
    {
        graphics.DrawLine(shadow, x, top, x, bottom);
        graphics.DrawLine(signal, x, top, x, bottom);
    }
}

internal sealed class KyMonApplicationContext : ApplicationContext
{
    private readonly object stopLock = new object();
    private readonly string appRoot;
    private readonly string nodePath;
    private readonly string cloudflaredPath;
    private readonly EventWaitHandle restoreEvent;
    private readonly IntPtr consoleWindow;
    private readonly NotifyIcon trayIcon;
    private readonly System.Windows.Forms.Timer timer;
    private readonly ToolStripMenuItem publicBrowserItem;
    private readonly ToolStripMenuItem copyLinkItem;
    private Process server;
    private Process tunnel;
    private bool hiddenToTray;
    private volatile bool exitRequested;
    private bool stopping;
    private bool serverStopped;
    private bool tunnelStopped;
    private bool waitingForEnter;
    private volatile bool enterPressed;
    private volatile string publicUrl;
    private volatile string tunnelUrl;
    private string appliedPublicUrl;

    internal int ResultCode { get; private set; }

    internal KyMonApplicationContext(string root, string node, string cloudflared, EventWaitHandle restore)
    {
        appRoot = root;
        nodePath = node;
        cloudflaredPath = cloudflared;
        restoreEvent = restore;
        consoleWindow = NativeMethods.GetConsoleWindow();

        trayIcon = new NotifyIcon();
        trayIcon.Icon = TrayIconFactory.Create();
        trayIcon.Text = "Ky Mon Local - GPT-5.6 Sol";
        trayIcon.Visible = false;
        trayIcon.DoubleClick += delegate { RestoreConsole(); };

        ContextMenuStrip menu = new ContextMenuStrip();
        ToolStripMenuItem showItem = new ToolStripMenuItem("Mo cua so Ky Mon");
        ToolStripMenuItem browserItem = new ToolStripMenuItem("Mo giao dien tren may");
        publicBrowserItem = new ToolStripMenuItem("Mo link Internet");
        copyLinkItem = new ToolStripMenuItem("Sao chep link Internet");
        ToolStripMenuItem exitItem = new ToolStripMenuItem("Thoat server");
        publicBrowserItem.Enabled = false;
        copyLinkItem.Enabled = false;
        showItem.Click += delegate { RestoreConsole(); };
        browserItem.Click += delegate { Program.OpenBrowser("http://127.0.0.1:8765"); };
        publicBrowserItem.Click += delegate { Program.OpenBrowser(publicUrl); };
        copyLinkItem.Click += delegate { CopyPublicLink(); };
        exitItem.Click += delegate { RequestExit(); };
        menu.Items.Add(showItem);
        menu.Items.Add(browserItem);
        menu.Items.Add(publicBrowserItem);
        menu.Items.Add(copyLinkItem);
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(exitItem);
        trayIcon.ContextMenuStrip = menu;

        timer = new System.Windows.Forms.Timer();
        timer.Interval = 200;
        timer.Tick += OnTimerTick;
        timer.Start();

        StartServer();
        if (!serverStopped) StartTunnel();
    }

    internal void RequestExit()
    {
        exitRequested = true;
    }

    internal void EmergencyStop()
    {
        StopServerTree();
    }

    private void StartServer()
    {
        string serverPath = Path.Combine(appRoot, "local", "server.mjs");
        ProcessStartInfo info = new ProcessStartInfo();
        info.FileName = nodePath;
        info.Arguments = "\"" + serverPath + "\"";
        info.WorkingDirectory = appRoot;
        info.UseShellExecute = false;
        info.CreateNoWindow = true;
        info.RedirectStandardOutput = true;
        info.RedirectStandardError = true;
        info.EnvironmentVariables["QIMEN_CODEX_HOME"] = Program.CodexHome;
        info.EnvironmentVariables["CODEX_HOME"] = Program.CodexHome;
        info.EnvironmentVariables["QIMEN_OPEN_BROWSER"] = "1";
        if (!string.IsNullOrEmpty(Program.PairingCode))
            info.EnvironmentVariables["QIMEN_PAIRING_TOKEN"] = Program.PairingCode;

        server = new Process();
        server.StartInfo = info;
        server.OutputDataReceived += delegate(object sender, DataReceivedEventArgs args) {
            if (args.Data != null) Console.WriteLine(args.Data);
        };
        server.ErrorDataReceived += delegate(object sender, DataReceivedEventArgs args) {
            if (args.Data != null) Console.Error.WriteLine(args.Data);
        };

        try
        {
            if (!server.Start()) throw new InvalidOperationException("Khong khoi dong duoc Node.js.");
            server.BeginOutputReadLine();
            server.BeginErrorReadLine();
        }
        catch (Exception error)
        {
            ResultCode = 3;
            serverStopped = true;
            Console.Error.WriteLine("Khong khoi dong duoc server: " + error.Message);
            BeginWaitForEnter();
        }
    }

    private void StartTunnel()
    {
        ProcessStartInfo info = new ProcessStartInfo();
        info.FileName = cloudflaredPath;
        info.Arguments = "tunnel --no-autoupdate --url http://127.0.0.1:8765 --loglevel info";
        info.WorkingDirectory = appRoot;
        info.UseShellExecute = false;
        info.CreateNoWindow = true;
        info.RedirectStandardOutput = true;
        info.RedirectStandardError = true;

        tunnel = new Process();
        tunnel.StartInfo = info;
        tunnel.OutputDataReceived += delegate(object sender, DataReceivedEventArgs args) {
            if (args.Data != null) HandleTunnelLine(args.Data);
        };
        tunnel.ErrorDataReceived += delegate(object sender, DataReceivedEventArgs args) {
            if (args.Data != null) HandleTunnelLine(args.Data);
        };

        try
        {
            if (!tunnel.Start()) throw new InvalidOperationException("Khong khoi dong duoc Cloudflare Tunnel.");
            tunnel.BeginOutputReadLine();
            tunnel.BeginErrorReadLine();
        }
        catch (Exception error)
        {
            ResultCode = 4;
            tunnelStopped = true;
            Console.Error.WriteLine("Khong tao duoc link Internet: " + error.Message);
            StopServerTree();
            serverStopped = true;
            BeginWaitForEnter();
        }
    }

    private void HandleTunnelLine(string line)
    {
        Match match = Regex.Match(line, @"https://[a-z0-9-]+\.trycloudflare\.com", RegexOptions.IgnoreCase);
        if (match.Success)
        {
            string url = match.Value.ToLowerInvariant();
            if (tunnelUrl == url) return;
            tunnelUrl = url;
            publicUrl = null;
            try { File.WriteAllText(Path.Combine(appRoot, "TUNNEL-LINK.txt"), url + Environment.NewLine, new UTF8Encoding(false)); } catch { }
            Console.WriteLine();
            Console.WriteLine("Da tao kenh HTTPS. Dang ket noi voi website Ky Mon...");
            Console.WriteLine();
            ThreadPool.QueueUserWorkItem(delegate { PublishTunnel(url); });
            return;
        }

        if (line.IndexOf("ERR", StringComparison.OrdinalIgnoreCase) >= 0 ||
            line.IndexOf("WRN", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            Console.Error.WriteLine("[Cloudflare] " + line);
        }
    }

    private void PublishTunnel(string url)
    {
        string lastError = "Khong ro loi.";
        for (int attempt = 1; attempt <= 6; attempt++)
        {
            if (exitRequested || tunnelUrl != url) return;
            try
            {
                Program.UpdateRelay(url);
                if (exitRequested || tunnelUrl != url) return;
                publicUrl = Program.OfficialSite;
                try { File.WriteAllText(Path.Combine(appRoot, "PUBLIC-LINK.txt"), publicUrl + Environment.NewLine, new UTF8Encoding(false)); } catch { }
                Console.WriteLine("============================================================");
                Console.WriteLine("WEBSITE: " + publicUrl);
                Console.WriteLine(string.IsNullOrEmpty(Program.PairingCode)
                    ? "MA KET NOI AI: dung ma ghep noi moi da hien o phia tren."
                    : "MA KET NOI AI: " + Program.PairingCode);
                Console.WriteLine("Website da ket noi voi Codex tren may nay.");
                Console.WriteLine("============================================================");
                Console.WriteLine();
                return;
            }
            catch (Exception error)
            {
                lastError = error.Message;
                if (attempt < 6) Thread.Sleep(Math.Min(30000, 1000 << (attempt - 1)));
            }
        }
        Console.Error.WriteLine("Khong cap nhat duoc website Ky Mon: " + lastError);
        Console.Error.WriteLine("Kiem tra Internet roi khoi dong lai Ky Mon Local.");
    }

    private void CopyPublicLink()
    {
        if (string.IsNullOrEmpty(publicUrl)) return;
        try { Clipboard.SetText(publicUrl); } catch { }
    }

    private void OnTimerTick(object sender, EventArgs args)
    {
        if (restoreEvent.WaitOne(0)) RestoreConsole();

        if (publicUrl != appliedPublicUrl)
        {
            appliedPublicUrl = publicUrl;
            bool ready = !string.IsNullOrEmpty(appliedPublicUrl);
            publicBrowserItem.Enabled = ready;
            copyLinkItem.Enabled = ready;
        }

        if (exitRequested)
        {
            ResultCode = 0;
            StopServerTree();
            ExitThread();
            return;
        }

        if (enterPressed)
        {
            ExitThread();
            return;
        }

        if (!serverStopped && server != null && server.HasExited)
        {
            serverStopped = true;
            ResultCode = server.ExitCode;
            StopServerTree();
            tunnelStopped = true;
            RestoreConsole();
            Console.WriteLine();
            Console.WriteLine("Server da dung hoac cong 8765 dang duoc chuong trinh khac su dung.");
            BeginWaitForEnter();
            return;
        }

        if (!tunnelStopped && tunnel != null && tunnel.HasExited)
        {
            tunnelStopped = true;
            ResultCode = tunnel.ExitCode == 0 ? 4 : tunnel.ExitCode;
            RestoreConsole();
            Console.WriteLine();
            Console.WriteLine("Cloudflare Tunnel da dung; link Internet khong con hoat dong.");
            StopServerTree();
            serverStopped = true;
            BeginWaitForEnter();
            return;
        }

        if (!serverStopped && !tunnelStopped && consoleWindow != IntPtr.Zero && NativeMethods.IsIconic(consoleWindow))
        {
            HideToTray();
        }
    }

    private void HideToTray()
    {
        if (hiddenToTray) return;
        NativeMethods.ShowWindow(consoleWindow, NativeMethods.SW_HIDE);
        hiddenToTray = true;
        trayIcon.Visible = true;
        trayIcon.BalloonTipTitle = "Ky Mon Local";
        trayIcon.BalloonTipText = "Server va link Internet van chay. Bam dup icon de mo lai.";
        trayIcon.ShowBalloonTip(1800);
    }

    private void RestoreConsole()
    {
        if (consoleWindow == IntPtr.Zero) return;
        NativeMethods.ShowWindow(consoleWindow, NativeMethods.SW_RESTORE);
        NativeMethods.SetForegroundWindow(consoleWindow);
        hiddenToTray = false;
        trayIcon.Visible = false;
    }

    private void BeginWaitForEnter()
    {
        if (waitingForEnter) return;
        waitingForEnter = true;
        Console.WriteLine("Nhan Enter de dong cua so.");
        Thread reader = new Thread(delegate() {
            try { Console.ReadLine(); } catch { }
            enterPressed = true;
        });
        reader.IsBackground = true;
        reader.Start();
    }

    private void StopServerTree()
    {
        lock (stopLock)
        {
            if (stopping) return;
            stopping = true;
            KillProcessTree(tunnel);
            KillProcessTree(server);
        }
    }

    private static void KillProcessTree(Process process)
    {
        if (process == null) return;
        try
        {
            if (process.HasExited) return;
            ProcessStartInfo info = new ProcessStartInfo();
            info.FileName = Path.Combine(Environment.SystemDirectory, "taskkill.exe");
            info.Arguments = "/PID " + process.Id + " /T /F";
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            using (Process killer = Process.Start(info))
            {
                if (killer != null) killer.WaitForExit(5000);
            }
            if (!process.HasExited) process.Kill();
        }
        catch
        {
            try { if (!process.HasExited) process.Kill(); } catch { }
        }
    }

    protected override void ExitThreadCore()
    {
        timer.Stop();
        trayIcon.Visible = false;
        StopServerTree();
        base.ExitThreadCore();
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            timer.Dispose();
            trayIcon.Visible = false;
            trayIcon.Icon.Dispose();
            trayIcon.Dispose();
            if (server != null) server.Dispose();
            if (tunnel != null) tunnel.Dispose();
        }
        base.Dispose(disposing);
    }
}

internal static class Program
{
    private const string MutexName = "Local\\KyMonCodexLauncher";
    private const string RestoreEventName = "Local\\KyMonCodexRestore";
    internal const string OfficialSite = "https://kymon.pp.ua/";
    private const string RelayEndpoint = "https://ky-mon-codex-relay.dinhtrongddr.workers.dev/admin/origin";
    private static KyMonApplicationContext currentContext;
    private static NativeMethods.ConsoleCtrlHandler controlHandler;
    internal static string PairingCode { get; private set; }

    internal static readonly string CodexHome = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "KyMonCodex",
        "codex-home"
    );
    private static readonly string RelaySecretPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "KyMonCodex",
        "relay-admin.key"
    );
    private static readonly string PairingCodePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "KyMonCodex",
        "pairing-code.txt"
    );

    [STAThread]
    private static int Main(string[] args)
    {
        try
        {
            Console.OutputEncoding = new UTF8Encoding(false);
            Console.InputEncoding = new UTF8Encoding(false);
            Console.Title = "Ky Mon Local - GPT-5.6 Sol";
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
        }
        catch { }

        if (args.Length > 0 && args[0] == "--write-icon")
        {
            if (args.Length < 2) return 1;
            using (Icon icon = TrayIconFactory.Create())
            using (FileStream stream = File.Create(args[1])) icon.Save(stream);
            return 0;
        }

        if (args.Length > 0 && args[0] == "--self-test")
        {
            Application.EnableVisualStyles();
            using (Icon icon = TrayIconFactory.Create())
            using (NotifyIcon notify = new NotifyIcon())
            {
                notify.Icon = icon;
                notify.Text = "Ky Mon Local - GPT-5.6 Sol";
                notify.Visible = true;
                Application.DoEvents();
                notify.Visible = false;
                Console.WriteLine("TRAY_ICON_OK width=" + icon.Width + " height=" + icon.Height);
            }
            return 0;
        }

        bool createdNew;
        using (Mutex mutex = new Mutex(true, MutexName, out createdNew))
        {
            if (!createdNew)
            {
                SignalRestore();
                OpenBrowser();
                return 0;
            }

            try
            {
                using (EventWaitHandle restore = new EventWaitHandle(false, EventResetMode.AutoReset, RestoreEventName))
                {
                    string appRoot = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
                    string nodePath = FindOnPath("node.exe");
                    if (nodePath == null)
                    {
                        Console.Error.WriteLine("Khong tim thay Node.js 22 tro len trong PATH.");
                        Console.ReadLine();
                        return 2;
                    }
                    string cloudflaredPath = Path.Combine(appRoot, "tools", "cloudflared.exe");
                    if (!File.Exists(cloudflaredPath))
                    {
                        Console.Error.WriteLine("Khong tim thay tools\\cloudflared.exe.");
                        Console.ReadLine();
                        return 2;
                    }

                    Console.WriteLine("Dang kiem tra dang nhap ChatGPT cua Ky Mon...");
                    if (!HasChatGptLogin())
                    {
                        Console.Error.WriteLine("Ho so Ky Mon chua dang nhap ChatGPT.");
                        Console.Error.WriteLine("Hay mo LOGIN-WINDOWS.cmd, dang nhap xong roi chay lai.");
                        Console.ReadLine();
                        return 2;
                    }

                    Application.EnableVisualStyles();
                    Application.SetCompatibleTextRenderingDefault(false);
                    if (!File.Exists(RelaySecretPath))
                    {
                        Console.Error.WriteLine("Thieu khoa ket noi Cloudflare: " + RelaySecretPath);
                        Console.ReadLine();
                        return 2;
                    }
                    try
                    {
                        PairingCode = LoadPairingCode();
                    }
                    catch (Exception error)
                    {
                        Console.Error.WriteLine("Ma ghep noi cau hinh khong hop le: " + error.Message);
                        Console.ReadLine();
                        return 2;
                    }

                    Console.WriteLine("Dang khoi dong server va ket noi website Ky Mon.");
                    Console.WriteLine("Thu nho cua so de an xuong khay he thong.");
                    Console.WriteLine("Bam dup icon bat quai co cot song de mo lai.");
                    Console.WriteLine();

                    currentContext = new KyMonApplicationContext(appRoot, nodePath, cloudflaredPath, restore);
                    controlHandler = HandleConsoleControl;
                    NativeMethods.SetConsoleCtrlHandler(controlHandler, true);
                    AppDomain.CurrentDomain.ProcessExit += delegate {
                        if (currentContext != null) currentContext.EmergencyStop();
                    };
                    Application.Run(currentContext);
                    int result = currentContext.ResultCode;
                    currentContext.Dispose();
                    currentContext = null;
                    return result;
                }
            }
            finally
            {
                try { mutex.ReleaseMutex(); } catch { }
            }
        }
    }

    private static bool HandleConsoleControl(NativeMethods.CtrlType signal)
    {
        if (currentContext == null) return false;
        if (signal == NativeMethods.CtrlType.CtrlC || signal == NativeMethods.CtrlType.CtrlBreak)
        {
            currentContext.RequestExit();
            return true;
        }
        currentContext.EmergencyStop();
        return false;
    }

    private static bool HasChatGptLogin()
    {
        ProcessStartInfo info = new ProcessStartInfo();
        info.FileName = Environment.GetEnvironmentVariable("ComSpec") ?? "cmd.exe";
        info.Arguments = "/d /c call codex login status";
        info.UseShellExecute = false;
        info.CreateNoWindow = true;
        info.RedirectStandardOutput = true;
        info.RedirectStandardError = true;
        info.EnvironmentVariables["CODEX_HOME"] = CodexHome;
        try
        {
            using (Process process = Process.Start(info))
            {
                if (process == null) return false;
                process.StandardOutput.ReadToEnd();
                process.StandardError.ReadToEnd();
                if (!process.WaitForExit(30000))
                {
                    process.Kill();
                    return false;
                }
                return process.ExitCode == 0;
            }
        }
        catch
        {
            return false;
        }
    }

    private static string LoadPairingCode()
    {
        if (!File.Exists(PairingCodePath)) return null;
        string code = File.ReadAllText(PairingCodePath, Encoding.UTF8).Trim();
        if (code.Length < 6 || code.Length > 128)
            throw new InvalidOperationException("Can dai tu 6 den 128 ky tu.");
        return code;
    }

    internal static void UpdateRelay(string tunnelUrl)
    {
        string secret = File.ReadAllText(RelaySecretPath, Encoding.UTF8).Trim();
        if (secret.Length < 32) throw new InvalidOperationException("Khoa relay khong hop le.");
        string body = "{\"url\":\"" + tunnelUrl.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"}";
        byte[] bytes = Encoding.UTF8.GetBytes(body);
        HttpWebRequest request = (HttpWebRequest)WebRequest.Create(RelayEndpoint);
        request.Method = "POST";
        request.ContentType = "application/json";
        request.Headers["X-Qimen-Relay-Secret"] = secret;
        request.ContentLength = bytes.Length;
        request.Timeout = 15000;
        request.ReadWriteTimeout = 15000;
        using (Stream stream = request.GetRequestStream()) stream.Write(bytes, 0, bytes.Length);
        using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
        {
            int status = (int)response.StatusCode;
            if (status < 200 || status >= 300) throw new InvalidOperationException("Relay tra ve HTTP " + status + ".");
        }
    }

    private static string FindOnPath(string executable)
    {
        string path = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        string[] directories = path.Split(Path.PathSeparator);
        foreach (string rawDirectory in directories)
        {
            string directory = rawDirectory.Trim().Trim('"');
            if (directory.Length == 0) continue;
            try
            {
                string candidate = Path.Combine(directory, executable);
                if (File.Exists(candidate)) return candidate;
            }
            catch { }
        }
        return null;
    }

    private static void SignalRestore()
    {
        try
        {
            using (EventWaitHandle restore = EventWaitHandle.OpenExisting(RestoreEventName)) restore.Set();
        }
        catch { }
    }

    internal static void OpenBrowser()
    {
        OpenBrowser(OfficialSite);
    }

    internal static void OpenBrowser(string url)
    {
        if (string.IsNullOrEmpty(url)) return;
        try
        {
            ProcessStartInfo info = new ProcessStartInfo();
            info.FileName = url;
            info.UseShellExecute = true;
            Process.Start(info);
        }
        catch { }
    }
}
