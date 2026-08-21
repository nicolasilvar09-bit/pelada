/* ============================================================
   Fut Entre Amigos — camada nativa (Capacitor)
   Carregado só quando roda como app instalado. No navegador,
   cada função cai no equivalente web e nada quebra.
   ============================================================ */
(function () {
  'use strict';

  const Cap = window.Capacitor;
  const nativo = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const P = (nome) => (Cap && Cap.Plugins && Cap.Plugins[nome]) || null;

  const Nativo = {
    ativo: nativo,

    /* --- barra de status e teclado --- */
    async iniciar() {
      if (!nativo) return;
      const SB = P('StatusBar'), SS = P('SplashScreen'), KB = P('Keyboard');
      try { if (SB) { await SB.setStyle({ style: 'DARK' }); await SB.setBackgroundColor({ color: '#0b1a10' }); } } catch (e) {}
      try { if (KB) await KB.setAccessoryBarVisible({ isVisible: false }); } catch (e) {}
      try { if (SS) await SS.hide(); } catch (e) {}
      this.botaoVoltar();
      this.aoVoltarPraFrente();
    },

    /* --- vibração: gol, sorteio, erro --- */
    async vibrar(tipo) {
      if (!nativo) { if (navigator.vibrate) navigator.vibrate(tipo === 'gol' ? [40, 30, 60] : 25); return; }
      const H = P('Haptics'); if (!H) return;
      try {
        if (tipo === 'gol')       await H.notification({ type: 'SUCCESS' });
        else if (tipo === 'erro') await H.notification({ type: 'ERROR' });
        else if (tipo === 'forte')await H.impact({ style: 'HEAVY' });
        else                      await H.impact({ style: 'LIGHT' });
      } catch (e) {}
    },

    /* --- compartilhar convite / resumo --- */
    async compartilhar(texto, titulo) {
      if (nativo) {
        const S = P('Share');
        if (S) { try { await S.share({ title: titulo || 'Fut Entre Amigos', text: texto, dialogTitle: 'Compartilhar' }); return true; } catch (e) { return false; } }
      }
      if (navigator.share) { try { await navigator.share({ text: texto }); return true; } catch (e) { return false; } }
      try { await navigator.clipboard.writeText(texto); return 'copiado'; } catch (e) { return false; }
    },

    /* --- notificações: avisar o grupo da pelada --- */
    async pedirNotificacoes() {
      if (!nativo) return null;
      const PN = P('PushNotifications'); if (!PN) return null;
      try {
        let perm = await PN.checkPermissions();
        if (perm.receive === 'prompt') perm = await PN.requestPermissions();
        if (perm.receive !== 'granted') return null;
        await PN.register();
        return new Promise((ok) => {
          PN.addListener('registration', (t) => ok(t.value));
          setTimeout(() => ok(null), 6000);
        });
      } catch (e) { return null; }
    },

    /* --- botão voltar (Android) e gesto de voltar --- */
    botaoVoltar() {
      const A = P('App'); if (!A) return;
      try {
        A.addListener('backButton', ({ canGoBack }) => {
          if (window.__feaVoltar && window.__feaVoltar()) return;
          if (!canGoBack) A.exitApp();
          else window.history.back();
        });
      } catch (e) {}
    },

    /* --- ao voltar pro app, atualiza os dados --- */
    aoVoltarPraFrente() {
      const A = P('App'); if (!A) return;
      try {
        A.addListener('appStateChange', ({ isActive }) => {
          if (isActive && window.__feaAtualizar) window.__feaAtualizar();
        });
      } catch (e) {}
    }
  };

  window.Nativo = Nativo;
  document.addEventListener('DOMContentLoaded', () => Nativo.iniciar());
})();
