
// ==UserScript==
// @name         AntD 字段配置 (图标状态识别版)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  通过识别 check 图标 DOM 结构来判断选中状态，解决有动画无效果问题
// @match        https://sod*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const SELECTORS = {
        level1Trigger: '.grid-menu button.ant-btn-circle',
        level2Trigger: '.ant-menu-submenu-title[title="显示字段"]',
        fieldItems: 'li.ant-menu-item'
    };

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // --- 核心：仿真点击序列 ---
    async function simulateRealClick(element) {
        if (!element) return;
        const opts = { bubbles: true, cancelable: true, view: window };

        // 依次触发鼠标序列，确保 React 合成事件被激活
        element.dispatchEvent(new MouseEvent('mousedown', opts));
        await sleep(50);
        element.dispatchEvent(new MouseEvent('mouseup', opts));
        await sleep(50);

        // 尝试点击内部的 div，通常是文字所在层
        const innerDiv = element.querySelector('div') || element;
        innerDiv.click();
    }

    // --- 核心：判断是否真正被勾选 ---
    function isCheckIconExist(item) {
        // 检查内部是否含有 anticon-check 类（即那个打勾的图标）
        return !!item.querySelector('.anticon-check');
    }

    // --- UI 按钮创建 ---
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:10000; display:flex; gap:10px;';
    const mainBtn = createBtn('🚀 一键重置', '#1890ff');
    const setBtn = createBtn('⚙️ 设置字段', '#52c41a');
    container.appendChild(mainBtn); container.appendChild(setBtn);
    document.body.appendChild(container);

    function createBtn(text, bg) {
        const b = document.createElement('button');
        b.innerHTML = text;
        b.style.cssText = `padding:8px 15px; background:${bg}; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.2);`;
        return b;
    }

    // --- 智能重置逻辑 ---
    mainBtn.onclick = async () => {
        const targetFields = JSON.parse(localStorage.getItem('myAntdFields') || '[]');
        if (targetFields.length === 0) return alert('请先点击设置字段！');

        mainBtn.innerText = '⏳ 正在重置...';

        // 1. 打开一级
        const l1 = document.querySelector(SELECTORS.level1Trigger);
        if (l1) { l1.click(); await sleep(500); }

        // 2. 智能打开二级
        const l2 = document.querySelector(SELECTORS.level2Trigger);
        if (l2) {
            const parent = l2.closest('.ant-menu-submenu');
            const isOpened = l2.getAttribute('aria-expanded') === 'true' || (parent && parent.className.includes('open'));
            if (!isOpened) { l2.click(); await sleep(600); }
        }

        // 3. 遍历字段
        const items = document.querySelectorAll(SELECTORS.fieldItems);
        let actionCount = 0;

        for (const item of items) {
            const text = item.innerText.trim();
            if (targetFields.includes(text)) {
                // 【核心判断】：如果保存的配置里有它，但现在没有勾选图标，则点它
                if (!isCheckIconExist(item)) {
                    console.log(`[需要开启]: ${text}`);
                    await simulateRealClick(item);
                    actionCount++;
                    await sleep(300); // 必须留出时间让 React 插入图标 DOM
                } else {
                    console.log(`[已经是勾选状态]: ${text}`);
                }
            } else {
                // 【可选】：如果配置里没有它，但它现在有勾选图标，则反选它（隐藏）
                if (isCheckIconExist(item)) {
                    console.log(`[需要关闭]: ${text}`);
                    await simulateRealClick(item);
                    actionCount++;
                    await sleep(300);
                }
            }
        }

        mainBtn.innerText = '✅ 完成';
        setTimeout(() => {
            document.body.click();
            mainBtn.innerText = '🚀 一键重置';
        }, 500);
    };

    // --- 设置逻辑 ---
    setBtn.onclick = async () => {
        const l1 = document.querySelector(SELECTORS.level1Trigger);
        if (l1) l1.click(); await sleep(500);
        const l2 = document.querySelector(SELECTORS.level2Trigger);
        if (l2) l2.click(); await sleep(800);

        const items = document.querySelectorAll(SELECTORS.fieldItems);
        const allFields = Array.from(items).map(i => i.innerText.trim()).filter(t => t !== "");

        if (allFields.length === 0) return alert('未抓取到字段，请重试');

        showModal(allFields);
    };

    function showModal(allFields) {
        const saved = JSON.parse(localStorage.getItem('myAntdFields') || '[]');
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px; border-radius:8px; box-shadow:0 0 30px rgba(0,0,0,0.4); z-index:10001; max-height:80vh; overflow-y:auto; min-width:320px; color:#333;';
        let html = '<h3 style="margin-top:0">配置显示字段</h3><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
        allFields.forEach(f => {
            const checked = saved.includes(f) ? 'checked' : '';
            html += `<label style="cursor:pointer; display:flex; align-items:center; gap:5px;"><input type="checkbox" value="${f}" ${checked}> ${f}</label>`;
        });
        html += '</div><div style="margin-top:20px; text-align:right;"><button id="saveFields" style="background:#1890ff; color:white; border:none; padding:8px 20px; border-radius:4px; cursor:pointer;">保存配置</button></div>';
        modal.innerHTML = html;
        document.body.appendChild(modal);
        document.getElementById('saveFields').onclick = () => {
            const selected = Array.from(modal.querySelectorAll('input:checked')).map(i => i.value);
            localStorage.setItem('myAntdFields', JSON.stringify(selected));
            modal.remove();
            document.body.click();
        };
    }
})();
