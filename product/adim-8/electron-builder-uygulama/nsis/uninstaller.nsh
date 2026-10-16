; ==============================================================================
; ORTAC Akademik Asistan - Kullanıcı Odaklı NSIS Kaldırma Sihirbazı (Uninstaller)
; ==============================================================================

!include "LogicLib.nsh"

!macro customUnInit
    ; 1. Arka planda açık kalan backend ve uygulama süreçlerini güvenle sonlandır
    nsExec::Exec 'taskkill /F /IM backend-server.exe /T'
    nsExec::Exec 'taskkill /F /IM AkademikAsistan_Backend.exe /T'
    nsExec::Exec 'taskkill /F /IM "Akademik Asistan.exe" /T'
!macroend

!macro customUnInstall
    ; 2. Kullanıcıya net, saygılı ve veri koruma odaklı karar kutusu sun
    MessageBox MB_YESNO|MB_ICONQUESTION \
        "ORTAC Akademik Asistan kaldırılıyor.$\r$\n$\r$\nAkademik PDF kütüphanenizi ve ChromaDB veritabanınızı korumak istiyor musunuz?$\r$\n$\r$\n[EVET]: Kütüphanemi ve Vektörlerimi Koru (Önerilen)$\r$\nProgram dosyaları kaldırılır; makaleleriniz ve veritabanınız saklanır.$\r$\n$\r$\n[HAYIR]: Tam Temizlik Yap (Sıfır Kalıntı)$\r$\nProgramla birlikte tüm PDF arşivi, yerel veritabanı ve model önbellekleri silinir." \
        /SD IDYES IDYES keepData IDNO wipeAll

    wipeAll:
        ; Kullanıcının kayıt defterinde saklanan veri yolunu oku
        ReadRegStr $0 HKCU "Software\ORTAC\AkademikAsistan" "DataDir"
        ${If} $0 != ""
            ${If} ${FileExists} "$0"
                RMDir /r "$0"
            ${EndIf}
        ${EndIf}

        ; Standart ve yerel önbellek dizinlerini temizle
        RMDir /r "$APPDATA\akademik-asistan"
        RMDir /r "$LOCALAPPDATA\akademik-asistan"
        RMDir /r "$LOCALAPPDATA\akademik-asistan-updater"
        DeleteRegKey HKCU "Software\ORTAC\AkademikAsistan"
        Goto finishUninstall

    keepData:
        ; Kütüphaneye ve verilere dokunma, sadece uygulama önbelleklerini temizle
        RMDir /r "$LOCALAPPDATA\akademik-asistan-updater"
        Goto finishUninstall

    finishUninstall:
!macroend
