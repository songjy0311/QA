let selectedNodeId = null;
let currentTab = 'qa';
let expandedContentId = null;
let isUserLoggedIn = false;

const USER_USERNAME = 'user';
const USER_PASSWORD = 'user123';

function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'flex';
    }
}

function hideLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'none';
    }
}

function handleUserLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    if (username === USER_USERNAME && password === USER_PASSWORD) {
        isUserLoggedIn = true;
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userUsername', username);
        hideLoginModal();
        updateUserDisplay();
        showToast('登录成功', 'success');
    } else {
        errorDiv.textContent = '账号或密码错误';
        document.getElementById('loginPassword').value = '';
    }
}

function handleUserLogout() {
    isUserLoggedIn = false;
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userUsername');
    updateUserDisplay();
    showLoginModal();
}

function updateUserDisplay() {
    const userDisplayName = document.getElementById('userDisplayName');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (isUserLoggedIn) {
        const username = localStorage.getItem('userUsername') || USER_USERNAME;
        userDisplayName.textContent = username;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        userDisplayName.textContent = '游客';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

function checkUserLoginStatus() {
    const savedLoginStatus = localStorage.getItem('userLoggedIn');
    if (savedLoginStatus === 'true') {
        isUserLoggedIn = true;
        return true;
    }
    return false;
}

function renderDirectoryTree() {
    const container = document.getElementById('directoryTree');
    const tree = getMenuTree();

    const order = { custom: 0, func: 1, invalid: 2 };
    tree.sort((a, b) => (order[a.type] ?? 3) - (order[b.type] ?? 3));

    container.innerHTML = '';

    tree.forEach(rootNode => {
        if (rootNode.children) {
            rootNode.children.forEach(child => {
                const config = getNodeConfig(child.id);
                if (config.visible) {
                    const nodeEl = renderUserTreeNode(child);
                    if (nodeEl) container.appendChild(nodeEl);
                }
            });
        }
    });

    if (container.children.length === 0) {
        container.innerHTML = '<p class="empty-hint">暂无可见目录</p>';
    }
}

function renderUserTreeNode(node) {
    const config = getNodeConfig(node.id);
    if (!config.visible) return null;
    if (!isUserLoggedIn && !config.guestVisible) return null;

    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'tree-node-content';
    if (selectedNodeId === node.id) {
        contentDiv.classList.add('selected');
    }

    const expandSpan = document.createElement('span');
    expandSpan.className = 'tree-expand' + (node.children && node.children.length > 0 ? '' : ' hidden');
    if (node.expanded) expandSpan.classList.add('expanded');
    expandSpan.innerHTML = '▶';
    contentDiv.appendChild(expandSpan);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'tree-label';
    labelSpan.textContent = node.name;
    contentDiv.appendChild(labelSpan);

    nodeDiv.appendChild(contentDiv);

    if (node.children && node.children.length > 0 && node.expanded) {
        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'tree-children';
        node.children.forEach(child => {
            const childNode = renderUserTreeNode(child);
            if (childNode) childrenDiv.appendChild(childNode);
        });
        nodeDiv.appendChild(childrenDiv);
    }

    contentDiv.onclick = () => {
        if (node.children && node.children.length > 0) {
            const tree = getMenuTree();
            const treeNode = findNodeById(tree, node.id);
            if (treeNode) {
                treeNode.expanded = !treeNode.expanded;
                if (treeNode.expanded) {
                    function collapseAllDescendants(n) {
                        n.children?.forEach(c => {
                            c.expanded = false;
                            collapseAllDescendants(c);
                        });
                    }
                    collapseAllDescendants(treeNode);
                }
                saveMenuTree(tree);
            }
        }
        selectNode(node.id);
    };

    return nodeDiv;
}

function toggleNodeExpand(nodeId) {
    const tree = getMenuTree();
    const node = findNodeById(tree, nodeId);
    if (node) {
        node.expanded = !node.expanded;
        saveMenuTree(tree);
        renderDirectoryTree();
    }
}

function selectNode(nodeId) {
    selectedNodeId = nodeId;
    renderDirectoryTree();
    loadContentForNode(nodeId);
}

function loadContentForNode(nodeId) {
    const config = getNodeConfig(nodeId);
    if (!config.visible) return;
    if (!isUserLoggedIn && !config.guestVisible) return;

    const qaContent = getContent('qa');
    const manualContent = getContent('manual');

    const qaList = qaContent[nodeId] || [];
    const manualList = manualContent[nodeId] || [];

    const hasQA = qaList.length > 0;
    const hasManual = manualList.length > 0;
    const hasContent = hasQA || hasManual;

    const container = document.getElementById('tabContent');
    const tabHeader = document.getElementById('tabHeader');

    if (!hasContent) {
        tabHeader.innerHTML = '';
        container.innerHTML = '<p class="no-content-hint">这里暂时没有内容哦</p>';
        return;
    }

    let activeTab = currentTab;
    if (!hasQA && currentTab === 'qa') activeTab = 'manual';
    if (!hasManual && currentTab === 'manual') activeTab = 'qa';

    tabHeader.innerHTML = `
        ${hasQA ? `<button class="tab-btn ${activeTab === 'qa' ? 'active' : ''}" data-tab="qa">常见Q&A</button>` : ''}
        ${hasManual ? `<button class="tab-btn ${activeTab === 'manual' ? 'active' : ''}" data-tab="manual">操作手册</button>` : ''}
    `;

    container.innerHTML = `
        ${hasQA ? `
        <div class="tab-panel ${activeTab === 'qa' ? 'active' : ''}" data-panel="qa">
            <div class="content-display">
                ${qaList.map((item, index) => renderUserAccordionItem(item, 'qa', false)).join('')}
            </div>
        </div>
        ` : ''}
        ${hasManual ? `
        <div class="tab-panel ${activeTab === 'manual' ? 'active' : ''}" data-panel="manual">
            <div class="content-display">
                ${manualList.map((item, index) => renderUserAccordionItem(item, 'manual', false)).join('')}
            </div>
        </div>
        ` : ''}
    `;

    tabHeader.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });

    initUserAccordion();
}

function renderUserAccordionItem(item, type, isExpanded) {
    const votes = getVotes(item.id);
    const isExpandedFlag = expandedContentId === item.id;

    return `
        <div class="accordion-item ${isExpandedFlag ? 'expanded' : ''}" data-id="${item.id}">
            <div class="accordion-header">
                <span class="accordion-title">${item.title}</span>
                <span class="accordion-icon">▼</span>
            </div>
            <div class="accordion-content">
                <div class="content-body">${item.body}</div>
                ${item.attachment ? '<p class="attachment-note">📎 附件仅做演示，无法下载</p>' : ''}
                <div class="vote-buttons">
                    <button class="vote-btn like-btn ${votes.likes?.includes(CURRENT_USER_ID) ? 'active' : ''}" data-id="${item.id}" data-type="like">
                        👍 赞
                    </button>
                    <button class="vote-btn dislike-btn ${votes.dislikes?.includes(CURRENT_USER_ID) ? 'active' : ''}" data-id="${item.id}" data-type="dislike">
                        👎 踩
                    </button>
                </div>
                <div class="feedback-input" id="feedback-${item.id}">
                    <textarea placeholder="请输入您的意见（非必填）"></textarea>
                    <button class="btn btn-secondary" style="margin-top:8px;" onclick="submitDislike('${item.id}')">提交</button>
                </div>
            </div>
        </div>
    `;
}

function initUserAccordion() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.onclick = () => {
            const item = header.closest('.accordion-item');
            const itemId = item.dataset.id;
            const wasExpanded = item.classList.contains('expanded');

            document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('expanded'));

            if (!wasExpanded) {
                item.classList.add('expanded');
                expandedContentId = itemId;
            } else {
                expandedContentId = null;
            }
        };
    });

    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            handleVote(btn.dataset.id, 'like');
        };
    });

    document.querySelectorAll('.dislike-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            handleVote(btn.dataset.id, 'dislike');
        };
    });
}

function handleVote(contentId, voteType) {
    const userId = CURRENT_USER_ID;
    const votes = getVotes(contentId);
    votes.likes = votes.likes || [];
    votes.dislikes = votes.dislikes || [];
    votes.feedback = votes.feedback || {};

    if (voteType === 'like') {
        if (votes.likes.includes(userId)) {
            votes.likes = votes.likes.filter(id => id !== userId);
        } else {
            votes.likes.push(userId);
            votes.dislikes = votes.dislikes.filter(id => id !== userId);
            delete votes.feedback[userId];
        }
        saveVotes(contentId, votes);
        loadContentForNode(selectedNodeId);
    } else {
        if (votes.dislikes.includes(userId)) {
            votes.dislikes = votes.dislikes.filter(id => id !== userId);
            delete votes.feedback[userId];
            saveVotes(contentId, votes);
            loadContentForNode(selectedNodeId);
        } else {
            const feedbackEl = document.querySelector(`#feedback-${contentId}`);
            if (feedbackEl) {
                feedbackEl.classList.add('show');
            }
        }
    }
}

function submitDislike(contentId) {
    const feedback = document.querySelector(`#feedback-${contentId} textarea`)?.value;
    const userId = CURRENT_USER_ID;
    const votes = getVotes(contentId);
    votes.likes = votes.likes || [];
    votes.dislikes = votes.dislikes || [];
    votes.feedback = votes.feedback || {};

    if (!votes.dislikes.includes(userId)) {
        votes.dislikes.push(userId);
    }
    if (votes.likes.includes(userId)) {
        votes.likes = votes.likes.filter(id => id !== userId);
    }

    if (feedback) {
        votes.feedback[userId] = feedback;
    }

    saveVotes(contentId, votes);
    showToast('意见已提交', 'success');
    loadContentForNode(selectedNodeId);
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.dataset.panel === tab);
    });
}

function autoLocateNode() {
    const params = new URLSearchParams(window.location.search);
    const sourceUrl = params.get('from') || document.referrer;

    if (!sourceUrl) return;

    const tree = getMenuTree();
    let targetNode = null;

    function searchNode(nodes) {
        for (const node of nodes) {
            const config = getNodeConfig(node.id);
            if (config.url && sourceUrl.includes(config.url)) {
                targetNode = node;
                break;
            }
            if (node.children) {
                searchNode(node.children);
            }
        }
    }

    searchNode(tree);

    if (targetNode) {
        selectNode(targetNode.id);

        const treeData = getMenuTree();
        function expandToNode(nodes, targetId) {
            for (const node of nodes) {
                if (node.id === targetId) return true;
                if (node.children && expandToNode(node.children, targetId)) {
                    node.expanded = true;
                    return true;
                }
            }
            return false;
        }
        expandToNode(treeData, targetNode.id);
        saveMenuTree(treeData);

        renderDirectoryTree();
    }
}

function init() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleUserLogin);
    }

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleUserLogout);
    }

    const loginCancelBtn = document.getElementById('loginCancelBtn');
    if (loginCancelBtn) {
        loginCancelBtn.addEventListener('click', () => {
            hideLoginModal();
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            document.getElementById('loginError').textContent = '';
        });
    }

    checkUserLoginStatus();
    updateUserDisplay();

    initStorage();

    const tree = getMenuTree();
    function resetExpanded(nodes) {
        nodes.forEach(node => {
            node.expanded = false;
            if (node.children) resetExpanded(node.children);
        });
    }
    resetExpanded(tree);
    saveMenuTree(tree);

    renderDirectoryTree();

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });

    autoLocateNode();

    if (!selectedNodeId) {
        const tree = getMenuTree();
        function findFirstVisibleNode(nodes) {
            for (const node of nodes) {
                const config = getNodeConfig(node.id);
                if (config.visible && (!isUserLoggedIn ? config.guestVisible : true)) {
                    return node;
                }
                if (node.children) {
                    const found = findFirstVisibleNode(node.children);
                    if (found) return found;
                }
            }
            return null;
        }
        const firstVisible = findFirstVisibleNode(tree);
        if (firstVisible) {
            selectNode(firstVisible.id);
        }
    }
}

document.addEventListener('DOMContentLoaded', init);