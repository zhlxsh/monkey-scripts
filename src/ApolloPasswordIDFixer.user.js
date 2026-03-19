// ==UserScript==
// @name         Apollo Password ID Fixer
// @namespace    http://tampermonkey.net/
// @version      2026-03-19
// @description  为 *conf.*min.com 的密码框自动添加 id="password" 以修复浏览器自动填充
// @author       Gemini
// @match        https://*conf.*min.com/signin*
// @grant        none
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let honeypotInjected = false;

    const injectHoneypot = () => {
        if (honeypotInjected) return;

        const userInput = document.querySelector('input[name="username"]');
        if (userInput) {
            console.log('[Fix] 准备注入蜜罐字段以阻止地址提示...');

            // 1. 规范化真正的登录框
            userInput.id = 'username';
            userInput.setAttribute('autocomplete', 'username');
            const pwdInput = document.querySelector('input[type="password"]');
            if (pwdInput) {
                pwdInput.id = 'password';
                pwdInput.setAttribute('autocomplete', 'current-password');
            }

            // 2. 创建并注入蜜罐（Honeypot）字段
            // 这些字段被视觉隐藏，但对浏览器可见。
            const html = `
                <div style="opacity: 0; position: absolute; top: 0; left: 0; height: 0; width: 0; z-index: -1; overflow: hidden;">
                    <input type="text" name="street-address" autocomplete="street-address" tabindex="-1">
                    <input type="text" name="city" autocomplete="address-level2" tabindex="-1">
                    <input type="text" name="postal-code" autocomplete="postal-code" tabindex="-1">
                </div>
            `;

            // 将蜜罐插入到用户名框之前
            userInput.insertAdjacentHTML('beforebegin', html);

            honeypotInjected = true;
            console.log('[Fix] 蜜罐字段注入成功。');
        }
    };

    injectHoneypot();
    const observer = new MutationObserver(() => injectHoneypot());
    observer.observe(document.body, { childList: true, subtree: true });
})();

