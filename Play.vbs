' Starts Detective Mystery with no black console window. The game opens in its own window.
' If nothing happens, double-click "Play (show errors).bat" instead to see the message.
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
here = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = here
If Not fso.FileExists(here & "\hiddentruth_web.exe") Then
  MsgBox "hiddentruth_web.exe was not found next to this file. Unzip the whole folder first.", 48, "Detective Mystery"
Else
  sh.Run """" & here & "\hiddentruth_web.exe"" data web --auto-close", 0, False
End If
