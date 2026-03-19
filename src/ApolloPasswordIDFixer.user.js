// ==UserScript==
// @name         Apollo UI Fixer综合优化助手 (折叠 + 修复地址提示)
// @namespace    http://tampermonkey.net/
// @version      2026-03-19
// @description  1. 自动折叠 Namespace 2. 点击侧边栏自动折叠 3. 注入蜜罐字段阻止浏览器错误的地址自动填充
// @match        https://*conf.*.com/config*
// @match        https://*conf.*.com/signin*
// @author       Gemini
// @grant        none
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置与状态 ====================
    let honeypotInjected = false;

    // ==================== 1. 折叠逻辑 (Collapse Logic) ====================
    
    const forceCollapseAll = () => {
        const targets = document.querySelectorAll('span.cursor-pointer[data-toggle="collapse"]');
        let count = 0;

        targets.forEach(el => {
            // 判定是否处于展开状态
            const isExpanded = el.getAttribute('aria-expanded') === 'true' || !el.classList.contains('collapsed');

            if (isExpanded) {
                // 模拟点击触发 Angular 状态变更
                el.click();
                // 强制修正 class 和属性确保视觉同步
                el.classList.add('collapsed');
                el.setAttribute('aria-expanded', 'false');
                count++;
            }
        });

        if (count > 0) console.log(`[折叠助手] 已自动处理 ${count} 个项目`);
    };

    // 绘制悬浮按钮
    const drawCollapseUI = () => {
        if (document.getElementById('my-collapse-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'my-collapse-btn';
        btn.innerHTML = '全部折叠';
        btn.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            padding: 8px 16px; background: #428bca; color: #fff;
            border: none; border-radius: 4px; cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2); font-weight: bold;
        `;
        btn.onclick = forceCollapseAll;
        document.body.appendChild(btn);
    };

    // ==================== 2. 蜜罐逻辑 (Honeypot Logic) ====================

    const injectHoneypot = () => {
        if (honeypotInjected) return;

        const userInput = document.querySelector('input[name="username"]');
        if (userInput) {
            console.log('[蜜罐助手] 发现登录框，正在注入伪装字段以拦截地址提示...');

            // 规范化真正的登录框
            userInput.id = 'username';
            userInput.setAttribute('autocomplete', 'username');
            const pwdInput = document.querySelector('input[type="password"]');
            if (pwdInput) {
                pwdInput.id = 'password';
                pwdInput.setAttribute('autocomplete', 'current-password');
            }

            // 创建视觉隐藏的地址蜜罐字段
            const html = `
                <div style="opacity: 0; position: absolute; top: 0; left: 0; height: 0; width: 0; z-index: -1; overflow: hidden;">
                    <input type="text" name="street-address" autocomplete="street-address" tabindex="-1">
                    <input type="text" name="city" autocomplete="address-level2" tabindex="-1">
                    <input type="text" name="postal-code" autocomplete="postal-code" tabindex="-1">
                </div>
            `;
            userInput.insertAdjacentHTML('beforebegin', html);
            honeypotInjected = true;
        }
    };

    // ==================== 3. 核心事件监听 ====================

    // A. 监听全局点击 (特别是侧边栏)
    document.addEventListener('click', (event) => {
        const treeNode = event.target.closest('.node-treeview');
        if (treeNode) {
            console.log('[折叠助手] 侧边栏切换，准备折叠新内容...');
            // 设置多重延迟处理异步加载
            setTimeout(forceCollapseAll, 400);
            setTimeout(forceCollapseAll, 1000);
            setTimeout(forceCollapseAll, 2000);
        }
    }, true);

    // B. 使用一个 MutationObserver 同时驱动两个功能
    const mainObserver = new MutationObserver(() => {
        // 功能1: 动态绘制按钮
        drawCollapseUI();
        
        // 功能2: 动态检查并注入蜜罐 (如果蜜罐被页面刷新洗掉了则重注)
        if (!document.getElementsByName('street-address').length) {
            honeypotInjected = false; 
            injectHoneypot();
        }

        // 功能3: 自动折叠（如果发现页面突然加载了超过5个展开项）
        const expandedItems = document.querySelectorAll('span.cursor-pointer[data-toggle="collapse"][aria-expanded="true"]');
        if (expandedItems.length > 5) {
            forceCollapseAll();
        }
    });

    mainObserver.observe(document.body, { childList: true, subtree: true });

    // C. 页面初次加载执行
    window.addEventListener('load', () => {
        setTimeout(forceCollapseAll, 1000);
        injectHoneypot();
    });

})();
