let selectedNodeId = null;
let currentTab = 'qa';
let draggedNode = null;
let selectedContentIds = [];
let isContentSelectionMode = false;
let isLoggedIn = false;

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'flex';
    }
}

function hideLoginModal() {
    const loginModal = document.getElementById('loginModal');
    const app = document.getElementById('app');
    if (loginModal) {
        loginModal.style.display = 'none';
    }
    if (app) {
        app.classList.remove('app-hidden');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminUsername', username);
        hideLoginModal();
        updateUserInfo();
    } else {
        errorDiv.textContent = '账号或密码错误';
        document.getElementById('loginPassword').value = '';
    }
}

function handleLogout() {
    isLoggedIn = false;
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');
    document.getElementById('adminUsername').textContent = '';
    document.getElementById('logoutBtn').style.display = 'none';
    showLoginModal();
}

function updateUserInfo() {
    if (isLoggedIn) {
        const username = localStorage.getItem('adminUsername') || ADMIN_USERNAME;
        document.getElementById('adminUsername').textContent = '欢迎，' + username;
        document.getElementById('logoutBtn').style.display = 'inline-block';
    }
}

function checkLoginStatus() {
    const savedLoginStatus = localStorage.getItem('adminLoggedIn');
    if (savedLoginStatus === 'true') {
        isLoggedIn = true;
        hideLoginModal();
        updateUserInfo();
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
        const rootDiv = document.createElement('div');
        rootDiv.className = 'tree-root';

        const rootLabel = document.createElement('div');
        rootLabel.className = 'tree-root-label';
        rootLabel.textContent = rootNode.name;
        rootDiv.appendChild(rootLabel);

        if (rootNode.type === 'custom' || rootNode.type === 'invalid') {
            const rootActions = document.createElement('div');
            rootActions.className = 'tree-actions';
            rootActions.style.display = 'inline-block';
            rootActions.style.marginLeft = '8px';

            const addBtn = document.createElement('button');
            addBtn.className = 'tree-action-btn';
            addBtn.textContent = '+';
            addBtn.title = '新增子节点';
            addBtn.onclick = (e) => {
                e.stopPropagation();
                showAddNodeModal(rootNode.id);
            };
            rootActions.appendChild(addBtn);
            rootLabel.appendChild(rootActions);
        }

        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-children';

        if (rootNode.children && rootNode.children.length > 0) {
            rootNode.children.forEach(child => {
                childrenContainer.appendChild(renderTreeNode(child, rootNode.type, 1));
            });
        }

        rootDiv.appendChild(childrenContainer);
        container.appendChild(rootDiv);
    });

    initDragAndDrop();
}

function renderTreeNode(node, parentType, level) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';
    nodeDiv.dataset.nodeId = node.id;
    nodeDiv.dataset.nodeType = node.type;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'tree-node-content';
    if (selectedNodeId === node.id) {
        contentDiv.classList.add('selected');
    }
    contentDiv.draggable = node.type !== 'func_root';

    function hasContent(n) {
        const qaContent = getContent('qa');
        const manualContent = getContent('manual');
        if (qaContent[n.id]?.length > 0 || manualContent[n.id]?.length > 0) return true;
        if (n.children) {
            return n.children.some(child => hasContent(child));
        }
        return false;
    }

    const hasDirectContent = (() => {
        const qaContent = getContent('qa');
        const manualContent = getContent('manual');
        return qaContent[node.id]?.length > 0 || manualContent[node.id]?.length > 0;
    })();

    const hasChildContent = (() => {
        if (node.children) {
            return node.children.some(child => hasContent(child));
        }
        return false;
    })();

    const expandSpan = document.createElement('span');
    expandSpan.className = 'tree-expand' + (node.children && node.children.length > 0 ? '' : ' hidden');
    if (node.expanded) expandSpan.classList.add('expanded');
    expandSpan.innerHTML = '▶';
    contentDiv.appendChild(expandSpan);

    if (hasDirectContent) {
        const directIndicator = document.createElement('span');
        directIndicator.className = 'content-indicator direct';
        directIndicator.title = '本节点有挂载内容';
        contentDiv.appendChild(directIndicator);
    }

    if (hasChildContent) {
        const childIndicator = document.createElement('span');
        childIndicator.className = 'content-indicator child';
        childIndicator.title = '子节点有挂载内容';
        contentDiv.appendChild(childIndicator);
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'tree-label';
    labelSpan.textContent = node.name;
    labelSpan.ondblclick = () => editNodeName(node.id);
    contentDiv.appendChild(labelSpan);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'tree-actions';

    const showAddBtn = (parentType === 'custom' || parentType === 'invalid') && level < 3;
    if (showAddBtn) {
        const addBtn = document.createElement('button');
        addBtn.className = 'tree-action-btn';
        addBtn.textContent = '+';
        addBtn.title = '新增子节点';
        addBtn.onclick = (e) => {
            e.stopPropagation();
            showAddNodeModal(node.id);
        };
        actionsDiv.appendChild(addBtn);
    }

    const tree = getMenuTree();
    const rootType = findParentNode(tree, node.id)?.type || node.type;

    if ((rootType !== 'func' || node.type !== 'func') && node.type !== 'func_root') {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'tree-action-btn danger';
        deleteBtn.textContent = '✕';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteNode(node.id);
        };
        actionsDiv.appendChild(deleteBtn);
    }

    contentDiv.appendChild(actionsDiv);
    nodeDiv.appendChild(contentDiv);

    if (node.children && node.children.length > 0 && node.expanded) {
        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'tree-children';
        node.children.forEach(child => {
            childrenDiv.appendChild(renderTreeNode(child, parentType, level + 1));
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
    renderNodeConfig();
    loadContentForNode(nodeId);
}

function renderNodeConfig() {
    const container = document.getElementById('nodeConfigContent');

    if (!selectedNodeId) {
        container.innerHTML = '<p class="empty-hint">请从左侧目录树选择一个节点</p>';
        return;
    }

    const tree = getMenuTree();
    const node = findNodeById(tree, selectedNodeId);
    if (!node) {
        container.innerHTML = '<p class="empty-hint">节点不存在</p>';
        return;
    }

    const config = getNodeConfig(selectedNodeId);
    const rootType = findParentNode(tree, selectedNodeId)?.type || node.type;
    const isFuncRootChild = rootType === 'func' && node.type === 'func';

    container.innerHTML = `
        <div class="config-form">
            <div class="form-group">
                <label class="form-label">节点名称</label>
                <input type="text" class="form-input" id="nodeNameInput" value="${node.name}"
                    ${node.type === 'func' && node.id.includes('func_root') ? 'disabled' : ''}
                    maxlength="50">
            </div>
            <div class="form-group">
                <label class="form-checkbox">
                    <input type="checkbox" id="nodeVisibleInput" ${config.visible ? 'checked' : ''}>
                    <span>用户可见</span>
                </label>
                <small style="color: #999;">关闭后子节点也将不可见</small>
            </div>
            <div class="form-group">
                <label class="form-checkbox">
                    <input type="checkbox" id="nodeGuestVisibleInput" ${config.guestVisible ? 'checked' : ''} ${!config.visible ? 'disabled' : ''}>
                    <span>游客可见</span>
                </label>
                <small style="color: #999;">需先开启用户可见</small>
            </div>
            <div class="form-group">
                <label class="form-label">节点关联URL</label>
                <input type="text" class="form-input" id="nodeUrlInput" value="${config.url || ''}"
                    placeholder="输入来源URL，用于用户端自动定位">
            </div>
            <div style="margin-top: 16px;">
                <button class="btn btn-primary" id="saveNodeConfigBtn">保存配置</button>
            </div>
        </div>
    `;

    document.getElementById('saveNodeConfigBtn').onclick = saveNodeConfigHandler;

    const visibleInput = document.getElementById('nodeVisibleInput');
    const guestVisibleInput = document.getElementById('nodeGuestVisibleInput');

    visibleInput.addEventListener('change', () => {
        if (!visibleInput.checked) {
            guestVisibleInput.checked = false;
            guestVisibleInput.disabled = true;
        } else {
            guestVisibleInput.disabled = false;
        }
    });

    if (node.type === 'func' && node.id.includes('func_root')) {
        document.getElementById('nodeNameInput').disabled = true;
    }
}

function saveNodeConfigHandler() {
    const name = document.getElementById('nodeNameInput').value.trim();
    const visible = document.getElementById('nodeVisibleInput').checked;
    const guestVisible = document.getElementById('nodeGuestVisibleInput').checked;
    const url = document.getElementById('nodeUrlInput').value.trim();

    const tree = getMenuTree();
    const node = findNodeById(tree, selectedNodeId);

    if (node && !(node.type === 'func' && node.id.includes('func_root'))) {
        node.name = name;
        saveMenuTree(tree);
    }

    saveNodeConfig(selectedNodeId, { visible, guestVisible, url });

    if (!visible) {
        cascadeVisibility(selectedNodeId, false);
    }

    showToast('内容保存成功', 'success');
    renderDirectoryTree();
    renderNodeConfig();
}

function loadContentForNode(nodeId) {
    const qaContent = getContent('qa');
    const manualContent = getContent('manual');

    const qaList = qaContent[nodeId] || [];
    const manualList = manualContent[nodeId] || [];

    renderContentList('qa', qaList);
    renderContentList('manual', manualList);
}

function renderContentList(type, list) {
    const container = document.getElementById(type === 'qa' ? 'qaList' : 'manualList');

    if (list.length === 0) {
        container.innerHTML = '<p class="empty-hint">暂无内容</p>';
        return;
    }

    container.innerHTML = list.map(item => {
        const votes = getVotes(item.id);
        const isSelected = selectedContentIds.includes(item.id);
        return `
            <div class="content-item ${isSelected ? 'selected' : ''}" data-id="${item.id}" data-type="${type}" ${!isContentSelectionMode ? 'draggable="true"' : ''}>
                ${isContentSelectionMode ? `<input type="checkbox" class="content-checkbox" ${isSelected ? 'checked' : ''}>` : `<span class="drag-handle">⋮⋮</span>`}
                <div class="content-item-header">
                    <span class="content-item-title">${item.title}</span>
                    ${!isContentSelectionMode ? `<div class="content-item-actions">
                        <button class="tree-action-btn danger delete-btn">删除</button>
                    </div>` : ''}
                </div>
                <div class="content-item-meta">
                    <span>更新时间：${item.updateTime}</span>
                    <span>更新人：${item.updater || '管理员'}</span>
                </div>
                <div class="content-item-stats">
                    <span class="stat-item like-stat" data-id="${item.id}">👍 ${votes.likes?.length || 0}</span>
                    <span class="stat-item dislike-stat" data-id="${item.id}">👎 ${votes.dislikes?.length || 0}</span>
                </div>
            </div>
        `;
    }).join('');

    if (isContentSelectionMode) {
        initContentSelection(type);
    } else {
        initContentDragAndDrop(type);
        initContentItemEvents(type);
    }
}

function initContentSelection(type) {
    const container = document.getElementById(type === 'qa' ? 'qaList' : 'manualList');

    container.querySelectorAll('.content-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.closest('.content-item').dataset.id;
            if (e.target.checked) {
                if (!selectedContentIds.includes(id)) {
                    selectedContentIds.push(id);
                }
            } else {
                selectedContentIds = selectedContentIds.filter(i => i !== id);
            }
            updateContentHeaderState(type);
        });
    });
}

function initContentItemEvents(type) {
    const container = document.getElementById(type === 'qa' ? 'qaList' : 'manualList');

    container.querySelectorAll('.content-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn') || e.target.closest('.drag-handle') || e.target.closest('.stat-item')) {
                return;
            }
            const id = item.dataset.id;
            const itemType = item.dataset.type;
            showContentModal(itemType, id);
        });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = e.target.closest('.content-item').dataset.id;
            deleteContent(type, id);
        };
    });

    container.querySelectorAll('.like-stat').forEach(stat => {
        stat.onclick = (e) => {
            e.stopPropagation();
            const id = e.target.dataset.id;
            showVoteDetail(id, 'like');
        };
    });

    container.querySelectorAll('.dislike-stat').forEach(stat => {
        stat.onclick = (e) => {
            e.stopPropagation();
            const id = e.target.dataset.id;
            showVoteDetail(id, 'dislike');
        };
    });
}

function updateContentHeaderState(type) {
    const list = document.getElementById(type === 'qa' ? 'qaList' : 'manualList');
    const header = list.previousElementSibling;
    const selectedCount = selectedContentIds.length;

    let countSpan = header.querySelector('.selected-count');
    if (selectedCount > 0) {
        if (!countSpan) {
            countSpan = document.createElement('span');
            countSpan.className = 'selected-count';
            header.appendChild(countSpan);
        }
        countSpan.textContent = `已选择 ${selectedCount} 项`;
    } else if (countSpan) {
        countSpan.remove();
    }
}

function initContentDragAndDrop(type) {
    const container = document.getElementById(type === 'qa' ? 'qaList' : 'manualList');
    const items = container.querySelectorAll('.content-item');

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            if (isContentSelectionMode) {
                e.preventDefault();
                return;
            }
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.dataset.id);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            container.querySelectorAll('.content-item').forEach(i => {
                i.classList.remove('drag-over-top', 'drag-over-bottom');
            });
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (isContentSelectionMode) return;

            const dragging = container.querySelector('.dragging');
            if (!dragging || dragging === item) return;

            const rect = item.getBoundingClientRect();
            const relativeY = (e.clientY - rect.top) / rect.height;

            container.querySelectorAll('.content-item').forEach(i => {
                i.classList.remove('drag-over-top', 'drag-over-bottom');
            });

            if (relativeY < 0.5) {
                item.classList.add('drag-over-top');
            } else {
                item.classList.add('drag-over-bottom');
            }
        });

        item.addEventListener('dragleave', (e) => {
            const related = e.relatedTarget;
            if (!related || !item.contains(related)) {
                item.classList.remove('drag-over-top', 'drag-over-bottom');
            }
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            if (isContentSelectionMode) return;

            const draggedId = e.dataTransfer.getData('text/plain');
            const targetId = item.dataset.id;
            if (!draggedId || draggedId === targetId) return;

            const rect = item.getBoundingClientRect();
            const relativeY = (e.clientY - rect.top) / rect.height;
            const insertBefore = relativeY < 0.5;

            const allContent = getContent(type);
            const list = allContent[selectedNodeId] || [];

            const draggedIndex = list.findIndex(i => i.id === draggedId);
            const targetIndex = list.findIndex(i => i.id === targetId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                const [draggedItem] = list.splice(draggedIndex, 1);
                let newIndex = insertBefore ? targetIndex : targetIndex + 1;
                if (draggedIndex < targetIndex && !insertBefore) {
                    newIndex = targetIndex;
                } else if (draggedIndex > targetIndex && insertBefore) {
                    newIndex = targetIndex;
                } else if (draggedIndex === targetIndex) {
                    return;
                }
                list.splice(newIndex, 0, draggedItem);
                allContent[selectedNodeId] = list;
                saveContent(type, allContent);
                renderContentList(type, list);
            }
        });
    });
}

function startChangeNodeSelection(type) {
    if (isContentSelectionMode) {
        showNodeSelector();
        return;
    }

    isContentSelectionMode = true;
    selectedContentIds = [];

    const qaList = getContent('qa')[selectedNodeId] || [];
    const manualList = getContent('manual')[selectedNodeId] || [];
    renderContentList('qa', qaList);
    renderContentList('manual', manualList);

    updateChangeNodeButtonState();
}

function updateChangeNodeButtonState() {
    const qaBtn = document.getElementById('changeNodeQABtn');
    const manualBtn = document.getElementById('changeNodeManualBtn');
    const qaCancelBtn = document.getElementById('cancelChangeNodeBtn');
    const manualCancelBtn = document.getElementById('cancelChangeNodeManualBtn');

    if (isContentSelectionMode) {
        qaBtn.textContent = '确认选择';
        qaBtn.classList.add('btn-confirm');
        manualBtn.textContent = '确认选择';
        manualBtn.classList.add('btn-confirm');
        qaCancelBtn.style.display = 'inline-flex';
        manualCancelBtn.style.display = 'inline-flex';
    } else {
        qaBtn.textContent = '更换节点';
        qaBtn.classList.remove('btn-confirm');
        manualBtn.textContent = '更换节点';
        manualBtn.classList.remove('btn-confirm');
        qaCancelBtn.style.display = 'none';
        manualCancelBtn.style.display = 'none';
    }
}

function cancelChangeNodeSelection() {
    isContentSelectionMode = false;
    selectedContentIds = [];
    updateChangeNodeButtonState();

    if (selectedNodeId) {
        const qaList = getContent('qa')[selectedNodeId] || [];
        const manualList = getContent('manual')[selectedNodeId] || [];
        renderContentList('qa', qaList);
        renderContentList('manual', manualList);
    }
}

function showNodeSelector() {
    if (selectedContentIds.length === 0) {
        showToast('请先选择要移动的内容', 'error');
        return;
    }

    const tree = getMenuTree();
    let allOptions = [];

    function collectNodeOptions(nodes, level = 0, path = '', isRootNode = false) {
        nodes.forEach(node => {
            const currentPath = path ? `${path} > ${node.name}` : node.name;
            const indent = '\u00A0\u00A0'.repeat(level);
            const isCurrentNode = node.id === selectedNodeId;
            const isDisabled = isCurrentNode || (level === 0 && isRootNode);
            allOptions.push({
                id: node.id,
                name: node.name,
                indent: indent,
                displayName: `${indent}${node.name}${isCurrentNode ? ' (当前)' : ''}${level === 0 && isRootNode ? ' (根目录)' : ''}`,
                fullPath: currentPath,
                disabled: isDisabled
            });
            if (node.children && node.children.length > 0) {
                collectNodeOptions(node.children, level + 1, currentPath, false);
            }
        });
    }

    collectNodeOptions(tree, 0, '', true);

    function findNodePath(nodeId, nodes, path = []) {
        for (const node of nodes) {
            if (node.id === nodeId) {
                return [...path, node];
            }
            if (node.children) {
                const result = findNodePath(nodeId, node.children, [...path, node]);
                if (result) return result;
            }
        }
        return null;
    }

    function buildNodePath(nodeId) {
        const path = findNodePath(nodeId, tree, []);
        if (!path) return [];
        return path;
    }

    let nodeTreeHtml = '';

    function renderNodeTree(nodes, level = 0, parentExpanded = true) {
        nodes.forEach(node => {
            const isCurrentNode = node.id === selectedNodeId;
            const hasChildren = node.children && node.children.length > 0;
            const isDisabled = isCurrentNode || (level === 0);

            const shouldHide = level === 1 && !parentExpanded;

            nodeTreeHtml += `<div class="tree-node-item level-${level} ${isDisabled ? 'disabled' : ''} ${shouldHide ? 'hidden' : ''}" data-id="${node.id}" data-has-children="${hasChildren}" data-level="${level}">`;
            nodeTreeHtml += `<span class="tree-expand-icon">${hasChildren ? '▶' : ''}</span>`;
            nodeTreeHtml += `<span class="tree-node-name">${node.name}${isCurrentNode ? ' (当前)' : ''}</span>`;
            nodeTreeHtml += `</div>`;

            if (hasChildren) {
                const childDisplay = (level === 0) ? 'block' : 'none';
                nodeTreeHtml += `<div class="tree-children-container" style="display: ${childDisplay};">`;
                renderNodeTree(node.children, level + 1, level === 0);
                nodeTreeHtml += `</div>`;
            }
        });
    }

    renderNodeTree(tree);

    const modal = createModal('选择目标节点', `
        <div class="node-select-wrapper">
            <input type="text" class="form-input" id="nodeSearchInput" placeholder="输入节点名称搜索...">
            <div class="node-select-tree" id="nodeSelectTree">
                ${nodeTreeHtml}
            </div>
        </div>
    `, [
        { text: '取消', class: 'btn-secondary', onClick: () => { closeModal(); cancelChangeNodeSelection(); } },
        { text: '确认移动', class: 'btn-primary', onClick: () => confirmChangeNodeFromTree() }
    ]);

    document.getElementById('modalContainer').appendChild(modal);

    const searchInput = document.getElementById('nodeSearchInput');
    const nodeSelectTree = document.getElementById('nodeSelectTree');
    let selectedTargetId = null;
    let isSearchMode = false;

    nodeSelectTree.querySelectorAll('.tree-node-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.classList.contains('disabled')) return;

            const hasChildren = item.dataset.hasChildren === 'true';

            if (hasChildren) {
                const expandIcon = item.querySelector('.tree-expand-icon');
                const childrenContainer = item.nextElementSibling;
                if (childrenContainer && childrenContainer.classList.contains('tree-children-container')) {
                    if (childrenContainer.style.display === 'none') {
                        childrenContainer.style.display = 'block';
                        expandIcon.textContent = '▼';

                        if (isSearchMode) {
                            function showAllChildren(container) {
                                container.querySelectorAll('.tree-node-item').forEach(child => {
                                    if (!child.classList.contains('disabled')) {
                                        child.classList.remove('hidden');
                                        child.style.display = '';
                                    }
                                });
                                container.querySelectorAll('.tree-children-container').forEach(cc => {
                                    cc.style.display = 'none';
                                    cc.querySelector('.tree-expand-icon')?.forEach(icon => {
                                        if (icon.textContent === '▼') icon.textContent = '▶';
                                    });
                                });
                            }
                            showAllChildren(childrenContainer);
                        }
                    } else {
                        childrenContainer.style.display = 'none';
                        expandIcon.textContent = '▶';
                    }
                }
            }

            nodeSelectTree.querySelectorAll('.tree-node-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedTargetId = item.dataset.id;
        });
    });

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        isSearchMode = keyword !== '';

        if (keyword === '') {
            isSearchMode = false;
            nodeSelectTree.querySelectorAll('.tree-node-item').forEach(item => {
                item.classList.remove('hidden', 'search-match');
                item.style.display = '';
            });
            nodeSelectTree.querySelectorAll('.tree-children-container').forEach(container => {
                const level = parseInt(container.previousElementSibling?.dataset.level || '0');
                container.style.display = level === 0 ? 'block' : 'none';
            });
            nodeSelectTree.querySelectorAll('.tree-expand-icon').forEach(icon => {
                const item = icon.parentElement;
                const hasChildren = item.dataset.hasChildren === 'true';
                if (hasChildren) {
                    const level = parseInt(item.dataset.level || '0');
                    const container = item.nextElementSibling;
                    icon.textContent = container.style.display === 'none' ? '▶' : '▼';
                }
            });
        } else {
            const allItems = nodeSelectTree.querySelectorAll('.tree-node-item');
            allItems.forEach(item => {
                item.classList.remove('search-match');
                item.classList.add('hidden');
                item.style.display = 'none';
            });
            nodeSelectTree.querySelectorAll('.tree-children-container').forEach(container => {
                container.style.display = 'none';
            });

            allItems.forEach(item => {
                const name = item.querySelector('.tree-node-name').textContent.toLowerCase();
                if (name.includes(keyword)) {
                    item.classList.add('search-match');
                    item.classList.remove('hidden');
                    item.style.display = '';

                    const nodeId = item.dataset.id;
                    const path = buildNodePath(nodeId);

                    path.forEach((pathNode, index) => {
                        const isLast = index === path.length - 1;
                        if (!isLast) {
                            const level = parseInt(item.dataset.level || '0') - (path.length - 1 - index);
                            const pathItem = nodeSelectTree.querySelector(`.tree-node-item[data-id="${pathNode.id}"]`);
                            if (pathItem) {
                                pathItem.classList.remove('hidden');
                                pathItem.style.display = '';
                                const pathContainer = pathItem.nextElementSibling;
                                if (pathContainer && pathContainer.classList.contains('tree-children-container')) {
                                    pathContainer.style.display = 'block';
                                    const pathIcon = pathItem.querySelector('.tree-expand-icon');
                                    if (pathIcon) pathIcon.textContent = '▼';
                                }
                            }
                        }
                    });
                }
            });
        }
    });

    nodeSelectTree.querySelectorAll('.tree-node-item.disabled').forEach(item => {
        item.style.color = '#999';
        item.style.cursor = 'not-allowed';
    });

    const modalFooter = document.querySelector('.modal-footer');
    modalFooter.querySelector('.btn-primary').onclick = () => {
        if (!selectedTargetId) {
            showToast('请选择目标节点', 'error');
            return;
        }
        confirmChangeNodeWithId(selectedTargetId);
    };
}

function confirmChangeNodeFromTree() {
    const selectedItem = document.querySelector('.tree-node-item.selected');
    if (!selectedItem) {
        showToast('请选择目标节点', 'error');
        return;
    }
    confirmChangeNodeWithId(selectedItem.dataset.id);
}

function confirmChangeNodeWithId(targetNodeId) {
    const type = currentTab;
    const allContent = getContent(type);
    const sourceNodeId = selectedNodeId;

    const sourceList = allContent[sourceNodeId] || [];
    const itemsToMove = sourceList.filter(item => selectedContentIds.includes(item.id));

    if (itemsToMove.length === 0) {
        showToast('没有找到要移动的内容', 'error');
        return;
    }

    allContent[targetNodeId] = allContent[targetNodeId] || [];
    itemsToMove.forEach(item => {
        allContent[targetNodeId].push({...item, updateTime: new Date().toLocaleString()});
    });

    allContent[sourceNodeId] = sourceList.filter(item => !selectedContentIds.includes(item.id));
    saveContent(type, allContent);

    closeModal();
    cancelChangeNodeSelection();
    loadContentForNode(selectedNodeId);

    showToast(`成功移动 ${itemsToMove.length} 项内容到目标节点`, 'success');
}

function confirmChangeNode() {
    const targetNodeId = document.getElementById('targetNodeSelect').value;
    if (!targetNodeId) {
        showToast('请选择目标节点', 'error');
        return;
    }

    const type = currentTab;
    const allContent = getContent(type);
    const sourceNodeId = selectedNodeId;

    const sourceList = allContent[sourceNodeId] || [];
    const itemsToMove = sourceList.filter(item => selectedContentIds.includes(item.id));

    if (itemsToMove.length === 0) {
        showToast('没有找到要移动的内容', 'error');
        return;
    }

    allContent[targetNodeId] = allContent[targetNodeId] || [];
    itemsToMove.forEach(item => {
        allContent[targetNodeId].push({...item, updateTime: new Date().toLocaleString()});
    });

    allContent[sourceNodeId] = sourceList.filter(item => !selectedContentIds.includes(item.id));
    saveContent(type, allContent);

    closeModal();
    cancelChangeNodeSelection();
    loadContentForNode(selectedNodeId);

    showToast(`成功移动 ${itemsToMove.length} 项内容到目标节点`, 'success');
}

function initDragAndDrop() {
    const draggables = document.querySelectorAll('.tree-node-content[draggable="true"]');

    draggables.forEach(el => {
        el.addEventListener('dragstart', (e) => {
            draggedNode = el.closest('.tree-node');
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedNode.dataset.nodeId);
        });

        el.addEventListener('dragend', (e) => {
            el.classList.remove('dragging');
            document.querySelectorAll('.drag-over-top').forEach(el => el.classList.remove('drag-over-top'));
            document.querySelectorAll('.drag-over-bottom').forEach(el => el.classList.remove('drag-over-bottom'));
            document.querySelectorAll('.drag-over-child').forEach(el => el.classList.remove('drag-over-child'));
            document.querySelectorAll('.drag-over-invalid').forEach(el => el.classList.remove('drag-over-invalid'));
            draggedNode = null;
        });

        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            const targetContent = el;
            if (targetContent.classList.contains('dragging')) return;

            const draggedId = draggedNode?.dataset.nodeId;
            const targetId = targetContent.closest('.tree-node')?.dataset.nodeId;
            if (!draggedId || !targetId || draggedId === targetId) return;

            document.querySelectorAll('.drag-over-top, .drag-over-bottom, .drag-over-child, .drag-over-invalid').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-child', 'drag-over-invalid');
            });

            const draggedUnderFuncRoot = isUnderFuncRoot(draggedId);

            const rect = targetContent.getBoundingClientRect();
            const relativeY = (e.clientY - rect.top) / rect.height;

            const targetLevel = getNodeLevel(targetId);

            if (relativeY < 0.33) {
                targetContent.classList.add('drag-over-top');
            } else if (relativeY > 0.67) {
                if (draggedUnderFuncRoot) {
                    targetContent.classList.add('drag-over-invalid');
                } else if (targetLevel >= 3) {
                    targetContent.classList.add('drag-over-invalid');
                } else {
                    targetContent.classList.add('drag-over-bottom');
                }
            } else {
                if (draggedUnderFuncRoot) {
                    targetContent.classList.add('drag-over-invalid');
                } else if (targetLevel >= 3) {
                    targetContent.classList.add('drag-over-invalid');
                } else {
                    targetContent.classList.add('drag-over-child');
                }
            }
        });

        el.addEventListener('dragleave', (e) => {
            const related = e.relatedTarget;
            if (!related || !el.contains(related)) {
                el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-child', 'drag-over-invalid');
            }
        });

        el.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            const targetContent = el;
            const targetNode = targetContent.closest('.tree-node');
            if (!draggedId || !targetNode) return;

            const targetId = targetNode.dataset.nodeId;
            const draggedUnderFuncRoot = isUnderFuncRoot(draggedId);
            const targetLevel = getNodeLevel(targetId);

            const rect = targetContent.getBoundingClientRect();
            const relativeY = (e.clientY - rect.top) / rect.height;

            let dropMode;
            if (relativeY < 0.33) {
                dropMode = 'above';
            } else if (relativeY > 0.67) {
                if (draggedUnderFuncRoot) {
                    showToast('功能菜单根目录节点只能同父节点内排序', 'error');
                    dropMode = null;
                } else if (targetLevel >= 3) {
                    showToast('已达最大层级限制（根目录-一级-二级-三级），无法添加子节点', 'error');
                    dropMode = null;
                } else {
                    dropMode = 'below';
                }
            } else {
                if (draggedUnderFuncRoot) {
                    showToast('功能菜单根目录节点只能同父节点内排序', 'error');
                    dropMode = null;
                } else if (targetLevel >= 3) {
                    showToast('已达最大层级限制（根目录-一级-二级-三级），无法添加子节点', 'error');
                    dropMode = null;
                } else {
                    dropMode = 'child';
                }
            }

            if (dropMode) {
                handleDrop(draggedId, targetId, dropMode);
            }

            document.querySelectorAll('.drag-over-top, .drag-over-bottom, .drag-over-child, .drag-over-invalid').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-child', 'drag-over-invalid');
            });
        });
    });
}

function handleDrop(draggedId, targetId, dropMode) {
    const tree = getMenuTree();
    const draggedParent = findParentNode(tree, draggedId);
    const targetParent = findParentNode(tree, targetId);

    const sameParent = draggedParent?.id === targetParent?.id;
    const draggedUnderFuncRoot = isUnderFuncRoot(draggedId);

    if (draggedUnderFuncRoot && !sameParent) {
        showToast('功能菜单根目录节点只能同父节点内排序', 'error');
        return;
    }

    const targetUnderInvalidRoot = targetParent?.type === 'invalid';

    if (sameParent && dropMode !== 'child') {
        const children = draggedParent.children;
        const draggedIndex = children.findIndex(c => c.id === draggedId);
        const targetIndex = children.findIndex(c => c.id === targetId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            const [removed] = children.splice(draggedIndex, 1);
            let insertIndex;
            if (dropMode === 'above') {
                insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
            } else {
                insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
            }
            children.splice(insertIndex, 0, removed);
            saveMenuTree(tree);
            renderDirectoryTree();
        }
    } else {
        let draggedNodeCopy;
        function removeAndGet(nodes, id) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === id) {
                    draggedNodeCopy = JSON.parse(JSON.stringify(nodes[i]));
                    nodes.splice(i, 1);
                    return true;
                }
                if (nodes[i].children && removeAndGet(nodes[i].children, id)) return true;
            }
            return false;
        }
        removeAndGet(tree, draggedId);

        const targetNode = findNodeById(tree, targetId);
        if (!targetNode) return;

        if (targetUnderInvalidRoot || targetId === 'invalid_root') {
            draggedNodeCopy = regenerateNodeIds(draggedNodeCopy);
        }

        if (dropMode === 'child') {
            if (!targetNode.children) targetNode.children = [];
            targetNode.children.push(draggedNodeCopy);
        } else {
            const parent = findParentNode(tree, targetId);
            if (parent) {
                const targetIndex = parent.children.findIndex(c => c.id === targetId);
                const insertIndex = dropMode === 'above' ? targetIndex : targetIndex + 1;
                parent.children.splice(insertIndex, 0, draggedNodeCopy);
            }
        }

        saveMenuTree(tree);
        renderDirectoryTree();
    }
}

function showAddNodeModal(parentId) {
    const modal = createModal('新增节点', `
        <div class="config-form">
            <div class="form-group">
                <label class="form-label">节点名称 <span class="required">*</span></label>
                <input type="text" class="form-input" id="newNodeName" maxlength="50" placeholder="请输入节点名称">
            </div>
        </div>
    `, [
        { text: '取消', class: 'btn-secondary', onClick: closeModal },
        { text: '确定', class: 'btn-primary', onClick: () => addNode(parentId) }
    ]);

    document.getElementById('modalContainer').appendChild(modal);
}

function addNode(parentId) {
    const name = document.getElementById('newNodeName').value.trim();
    if (!name) {
        showToast('请输入节点名称', 'error');
        return;
    }

    const tree = getMenuTree();
    const parent = findNodeById(tree, parentId);

    if (parent) {
        parent.children = parent.children || [];
        parent.children.push({
            id: 'custom_' + Date.now(),
            name: name,
            type: 'custom',
            children: [],
            expanded: false,
            visible: true
        });
        saveMenuTree(tree);
        renderDirectoryTree();
        closeModal();
        showToast('节点添加成功', 'success');
    }
}

function deleteNode(nodeId) {
    const tree = getMenuTree();
    const node = findNodeById(tree, nodeId);
    if (!node) return;

    const qaContent = getContent('qa');
    const manualContent = getContent('manual');

    function hasContent(n) {
        if (qaContent[n.id]?.length > 0 || manualContent[n.id]?.length > 0) return true;
        if (n.children) {
            return n.children.some(child => hasContent(child));
        }
        return false;
    }

    if (hasContent(node)) {
        showConfirmModal(
            '该节点及子节点已挂载内容，删除后节点、子节点、所有挂载内容将永久删除且无法恢复，确认删除？',
            () => cascadeDelete(nodeId)
        );
    } else {
        cascadeDelete(nodeId);
    }
}

function cascadeDelete(nodeId) {
    let tree = getMenuTree();

    function collectIds(nodes, ids = []) {
        nodes.forEach(node => {
            ids.push(node.id);
            if (node.children) collectIds(node.children, ids);
        });
        return ids;
    }

    const node = findNodeById(tree, nodeId);
    if (node?.children) {
        const childIds = collectIds(node.children);
        childIds.forEach(id => {
            deleteContentByNodeId('qa', id);
            deleteContentByNodeId('manual', id);
        });
    }

    deleteContentByNodeId('qa', nodeId);
    deleteContentByNodeId('manual', nodeId);

    tree = getMenuTree();
    tree = removeNodeFromTree(tree, nodeId);
    saveMenuTree(tree);

    if (selectedNodeId === nodeId) {
        selectedNodeId = null;
    }

    renderDirectoryTree();
    showToast('删除成功', 'success');
}

function showContentModal(type, contentId = null) {
    let content = { title: '', body: '', attachment: null };

    if (contentId) {
        const allContent = getContent(type);
        const nodeContent = allContent[selectedNodeId] || [];
        const existing = nodeContent.find(c => c.id === contentId);
        if (existing) content = existing;
    }

    const modal = createModal(contentId ? '编辑内容' : '新增内容', `
        <div class="config-form">
            <div class="form-group">
                <label class="form-label">内容标题 <span class="required">*</span></label>
                <input type="text" class="form-input" id="contentTitle" maxlength="100" value="${content.title}" placeholder="请输入内容标题">
            </div>
            <div class="form-group">
                <label class="form-label">内容 <span class="required">*</span></label>
                <div class="rich-editor">
                    <div class="rich-editor-toolbar">
                        <button type="button" onclick="document.execCommand('bold')">B</button>
                        <button type="button" onclick="document.execCommand('italic')">I</button>
                        <button type="button" onclick="document.execCommand('underline')">U</button>
                        <button type="button" onclick="insertImage()">图片</button>
                    </div>
                    <div class="rich-editor-content" id="richEditorContent" contenteditable="true">${content.body || ''}</div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">附件上传</label>
                <input type="file" id="attachmentInput" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple>
                ${content.attachment ? '<div class="file-preview"><div class="file-preview-item">📎 ' + content.attachment.name + '</div></div>' : ''}
                <p class="attachment-note">⚠️ 附件仅做演示，无法下载</p>
            </div>
        </div>
    `, [
        { text: '取消', class: 'btn-secondary', onClick: closeModal },
        { text: '保存', class: 'btn-primary', onClick: () => saveContentHandler(type, contentId) }
    ]);

    document.getElementById('modalContainer').appendChild(modal);
}

function insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.execCommand('insertImage', false, e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function saveContentHandler(type, contentId) {
    const title = document.getElementById('contentTitle').value.trim();
    const body = document.getElementById('richEditorContent').innerHTML;

    if (!title) {
        showToast('请输入内容标题', 'error');
        return;
    }

    if (!body || body === '<br>') {
        showToast('请输入内容', 'error');
        return;
    }

    const allContent = getContent(type);
    allContent[selectedNodeId] = allContent[selectedNodeId] || [];

    if (contentId) {
        const index = allContent[selectedNodeId].findIndex(c => c.id === contentId);
        if (index !== -1) {
            allContent[selectedNodeId][index] = {
                ...allContent[selectedNodeId][index],
                title,
                body,
                updateTime: new Date().toLocaleString()
            };
        }
    } else {
        const newContent = {
            id: type + '_' + Date.now(),
            title,
            body,
            updateTime: new Date().toLocaleString(),
            updater: '管理员',
            attachment: null
        };
        allContent[selectedNodeId].push(newContent);
    }

    saveContent(type, allContent);
    closeModal();
    loadContentForNode(selectedNodeId);
    showToast('内容保存成功', 'success');
}

function deleteContent(type, contentId) {
    showConfirmModal('确认删除该内容吗？删除后无法恢复', () => {
        const allContent = getContent(type);
        if (allContent[selectedNodeId]) {
            allContent[selectedNodeId] = allContent[selectedNodeId].filter(c => c.id !== contentId);
            saveContent(type, allContent);
            loadContentForNode(selectedNodeId);
            showToast('删除成功', 'success');
        }
    });
}

function showVoteDetail(contentId, voteType) {
    const votes = getVotes(contentId);

    let content = '';
    if (voteType === 'like') {
        content = `
            <h4 style="margin-bottom: 12px;">👍 点赞记录 (${votes.likes?.length || 0})</h4>
            ${votes.likes?.length > 0 ? votes.likes.map(u => `<div class="detail-item"><span>${u}</span></div>`).join('') : '<p style="color:#999;">暂无点赞</p>'}
        `;
    } else {
        content = `
            <h4 style="margin-bottom: 12px;">👎 点踩记录 (${votes.dislikes?.length || 0})</h4>
            ${votes.dislikes?.length > 0 ? votes.dislikes.map(u => `<div class="detail-item"><span>${u}</span>${votes.feedback[u] ? '<span style="color:#666;"> - ' + votes.feedback[u] + '</span>' : ''}</div>`).join('') : '<p style="color:#999;">暂无点踩</p>'}
        `;
    }

    const modal = createModal(voteType === 'like' ? '点赞明细' : '点踩明细', `
        <div class="detail-list">${content}</div>
    `, [
        { text: '关闭', class: 'btn-secondary', onClick: closeModal }
    ]);

    document.getElementById('modalContainer').appendChild(modal);
}

function handleMenuFileUpload() {
    const input = document.getElementById('menuFileInput');
    const file = input.files[0];

    if (!file) return;

    if (!file.name.endsWith('.txt')) {
        showToast('文件格式不匹配，请上传指定格式txt', 'error');
        return;
    }

    showToast('菜单文件解析中，请稍候…', 'info');

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target.result;
            const menuData = parseMenuFile(text);

            if (menuData.length === 0) {
                showToast('文件格式不匹配，请上传指定格式txt', 'error');
                return;
            }

            const existingTree = getMenuTree();
            const mergedTree = mergeMenuTrees(existingTree, menuData);

            saveMenuTree(mergedTree);
            renderDirectoryTree();
            showToast('菜单文件解析成功，功能菜单已增量更新', 'success');
        } catch (err) {
            showToast('文件格式不匹配，请上传指定格式txt', 'error');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

async function downloadQA() {
    const qaContent = getContent('qa');
    const tree = getMenuTree();

    const flatData = [];

    function traverseNodes(nodes, path = []) {
        nodes.forEach(node => {
            const currentPath = [...path, node.name];
            if (qaContent[node.id] && qaContent[node.id].length > 0) {
                qaContent[node.id].forEach(item => {
                    flatData.push({
                        '根目录': currentPath[0] || '',
                        '一级目录': currentPath[1] || '',
                        '二级目录': currentPath[2] || '',
                        '三级目录': currentPath[3] || '',
                        '内容标题': item.title,
                        '内容': item.body.replace(/<[^>]*>/g, ''),
                        '更新时间': item.updateTime,
                        '更新人': item.updater || '管理员',
                        '点赞量': getVotes(item.id).likes?.length || 0,
                        '点踩量': getVotes(item.id).dislikes?.length || 0
                    });
                });
            }
            if (node.children) {
                traverseNodes(node.children, currentPath);
            }
        });
    }

    traverseNodes(tree);

    if (flatData.length === 0) {
        showToast('暂无内容可导出', 'error');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(flatData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Q&A');
    XLSX.writeFile(wb, `系统Q&A导出_${formatDate(new Date())}.xlsx`);
}

async function downloadManual() {
    const manualContent = getContent('manual');
    const tree = getMenuTree();

    const flatData = [];
    const docxContent = [];

    function traverseNodes(nodes, path = []) {
        nodes.forEach(node => {
            const currentPath = [...path, node.name];
            if (manualContent[node.id] && manualContent[node.id].length > 0) {
                manualContent[node.id].forEach(item => {
                    flatData.push({
                        '根目录': currentPath[0] || '',
                        '一级目录': currentPath[1] || '',
                        '二级目录': currentPath[2] || '',
                        '三级目录': currentPath[3] || '',
                        '内容标题': item.title,
                        '内容': item.body.replace(/<[^>]*>/g, ''),
                        '更新时间': item.updateTime,
                        '更新人': item.updater || '管理员',
                        '点赞量': getVotes(item.id).likes?.length || 0,
                        '点踩量': getVotes(item.id).dislikes?.length || 0
                    });
                });

                manualContent[node.id].forEach(item => {
                    const fileName = `${currentPath.join('-')}-${item.title}.docx`;
                    docxContent.push({
                        fileName,
                        content: item.body
                    });
                });
            }
            if (node.children) {
                traverseNodes(node.children, currentPath);
            }
        });
    }

    traverseNodes(tree);

    if (flatData.length === 0 && docxContent.length === 0) {
        showToast('暂无内容可导出', 'error');
        return;
    }

    const zip = new JSZip();

    const ws = XLSX.utils.json_to_sheet(flatData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '操作手册');
    const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    zip.file('操作手册汇总.xlsx', excelData);

    for (const doc of docxContent) {
        const docxData = HTMLtoDOCX(doc.content);
        zip.file(doc.fileName, docxData);
    }

    const zipData = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipData);
    link.download = `操作手册导出_${formatDate(new Date())}.zip`;
    link.click();
}

function HTMLtoDOCX(html) {
    const docx = htmlDocx.asBlob(html);
    return docx;
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

function init() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (!checkLoginStatus()) {
        showLoginModal();
        return;
    }

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

    document.getElementById('uploadMenuBtn').onclick = () => {
        document.getElementById('menuFileInput').click();
    };

    document.getElementById('menuFileInput').onchange = handleMenuFileUpload;
    document.getElementById('downloadQABtn').onclick = downloadQA;
    document.getElementById('downloadManualBtn').onclick = downloadManual;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });

    document.getElementById('addQABtn').onclick = () => showContentModal('qa');
    document.getElementById('addManualBtn').onclick = () => showContentModal('manual');
    document.getElementById('changeNodeQABtn').onclick = () => startChangeNodeSelection('qa');
    document.getElementById('changeNodeManualBtn').onclick = () => startChangeNodeSelection('manual');
    document.getElementById('cancelChangeNodeBtn').onclick = cancelChangeNodeSelection;
    document.getElementById('cancelChangeNodeManualBtn').onclick = cancelChangeNodeSelection;

    window.closeModal = closeModal;
}

document.addEventListener('DOMContentLoaded', init);