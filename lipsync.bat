@ECHO OFF

rem CHANGE 'NodeInstalledPath' to your NODE installed path. (where node.exe is)

set NodeInstalledPath="C:/nodejs/"

set /p varInput="Enter Input json filename: "

set /p varSound="Enter Audio filename: "

set /p varOutput="Enter Output json filename: "

%NodeInstalledPath%node.exe ls.js input=%varInput% sound=%varSound% output=%varOutput%

pause