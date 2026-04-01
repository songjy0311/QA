const STORAGE_KEYS = {
    MENU_TREE: 'manual_menu_tree',
    QA_CONTENT: 'manual_qa_content',
    MANUAL_CONTENT: 'manual_manual_content',
    VOTES: 'manual_votes',
    NODE_CONFIG: 'manual_node_config',
    TREE_STATE: 'manual_tree_state'
};

const ROOT_NODES = [
    { id: 'custom_root', name: '自定义根目录', type: 'custom', editable: true, deletable: false },
    { id: 'func_root', name: '功能菜单根目录', type: 'func', editable: false, deletable: false },
    { id: 'invalid_root', name: '失效菜单根目录', type: 'invalid', editable: true, deletable: false }
];

const CURRENT_USER_ID = 'demo_user';

function getStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function initStorage() {
    if (!getStorage(STORAGE_KEYS.MENU_TREE)) {
        const initialTree = ROOT_NODES.map(root => ({
            ...root,
            children: [],
            expanded: false,
            visible: true
        }));
        setStorage(STORAGE_KEYS.MENU_TREE, initialTree);
    }
    if (!getStorage(STORAGE_KEYS.QA_CONTENT)) {
        setStorage(STORAGE_KEYS.QA_CONTENT, {});
    }
    if (!getStorage(STORAGE_KEYS.MANUAL_CONTENT)) {
        setStorage(STORAGE_KEYS.MANUAL_CONTENT, {});
    }
    if (!getStorage(STORAGE_KEYS.VOTES)) {
        setStorage(STORAGE_KEYS.VOTES, {});
    }
    if (!getStorage(STORAGE_KEYS.NODE_CONFIG)) {
        setStorage(STORAGE_KEYS.NODE_CONFIG, {});
    }
}

function getMenuTree() {
    return getStorage(STORAGE_KEYS.MENU_TREE) || [];
}

function saveMenuTree(tree) {
    const order = { custom: 0, func: 1, invalid: 2 };
    tree.sort((a, b) => (order[a.type] ?? 3) - (order[b.type] ?? 3));
    setStorage(STORAGE_KEYS.MENU_TREE, tree);
}

function findNodeById(nodes, id) {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

function findParentNode(nodes, id) {
    for (const node of nodes) {
        if (node.children) {
            for (const child of node.children) {
                if (child.id === id) return node;
            }
            const found = findParentNode(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

function getNodeLevel(nodeId) {
    const tree = getMenuTree();
    let level = 0;
    let current = findNodeById(tree, nodeId);

    while (current) {
        const parent = findParentNode(tree, current.id);
        if (parent) {
            level++;
            current = parent;
        } else {
            break;
        }
    }
    return level;
}

function isUnderFuncRoot(nodeId) {
    const tree = getMenuTree();
    const funcRoot = tree.find(n => n.type === 'func');
    if (!funcRoot) return false;

    let current = findNodeById(tree, nodeId);
    while (current) {
        if (current.id === funcRoot.id) return true;
        current = findParentNode(tree, current.id);
    }
    return false;
}

function updateNodeInTree(nodes, id, updates) {
    return nodes.map(node => {
        if (node.id === id) {
            return { ...node, ...updates };
        }
        if (node.children) {
            return { ...node, children: updateNodeInTree(node.children, id, updates) };
        }
        return node;
    });
}

function removeNodeFromTree(nodes, id) {
    return nodes.filter(node => {
        if (node.id === id) return false;
        if (node.children) {
            node.children = removeNodeFromTree(node.children, id);
        }
        return true;
    });
}

function getNodeConfig(nodeId) {
    const configs = getStorage(STORAGE_KEYS.NODE_CONFIG) || {};
    return configs[nodeId] || { visible: false, url: '' };
}

function saveNodeConfig(nodeId, config) {
    const configs = getStorage(STORAGE_KEYS.NODE_CONFIG) || {};
    configs[nodeId] = { ...configs[nodeId], ...config };
    setStorage(STORAGE_KEYS.NODE_CONFIG, configs);
}

function getContent(type) {
    const key = type === 'qa' ? STORAGE_KEYS.QA_CONTENT : STORAGE_KEYS.MANUAL_CONTENT;
    return getStorage(key) || {};
}

function saveContent(type, content) {
    const key = type === 'qa' ? STORAGE_KEYS.QA_CONTENT : STORAGE_KEYS.MANUAL_CONTENT;
    setStorage(key, content);
}

function getVotes(contentId) {
    const votes = getStorage(STORAGE_KEYS.VOTES) || {};
    return votes[contentId] || { likes: [], dislikes: [], feedback: {} };
}

function saveVotes(contentId, votes) {
    const allVotes = getStorage(STORAGE_KEYS.VOTES) || {};
    allVotes[contentId] = votes;
    setStorage(STORAGE_KEYS.VOTES, allVotes);
}

function parseMenuFile(text) {
    const lines = text.trim().split('\n');
    const menuData = [];
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 4) {
            menuData.push({
                id: parts[0],
                name: parts[1],
                parentId: parts[2],
                level: parseInt(parts[3])
            });
        }
    }
    return menuData;
}

function buildMenuTree(menuData) {
    const nodeMap = {};
    const rootNodes = [];

    menuData.forEach(item => {
        nodeMap[item.id] = {
            id: item.id,
            name: item.name,
            type: 'func',
            children: [],
            expanded: false,
            visible: true,
            sourceParentId: item.parentId
        };
    });

    menuData.forEach(item => {
        if (item.parentId === '0') {
            rootNodes.push(nodeMap[item.id]);
        } else if (nodeMap[item.parentId]) {
            nodeMap[item.parentId].children.push(nodeMap[item.id]);
        }
    });

    return rootNodes;
}

function mergeMenuTrees(existingTree, newMenuNodes) {
    const funcRoot = existingTree.find(n => n.type === 'func');
    const invalidRoot = existingTree.find(n => n.type === 'invalid');
    if (!funcRoot) return existingTree;

    const existingNodeMap = {};
    function collectExisting(nodes) {
        nodes.forEach(node => {
            existingNodeMap[node.id] = { node, parentId: null };
            if (node.children) collectExisting(node.children);
        });
    }
    collectExisting(funcRoot.children || []);

    const newNodeIds = new Set(newMenuNodes.map(n => n.id));
    const toInvalidate = Object.keys(existingNodeMap).filter(id => !newNodeIds.has(id));

    toInvalidate.forEach(id => {
        const node = existingNodeMap[id].node;
        const qaContent = getContent('qa');
        const manualContent = getContent('manual');
        const hasContent = qaContent[node.id] || manualContent[node.id] ||
            (node.children && node.children.some(c => qaContent[c.id] || manualContent[c.id]));

        if (hasContent && invalidRoot) {
            const nodeCopy = JSON.parse(JSON.stringify(node));
            regenerateNodeIds(nodeCopy);
            invalidRoot.children = invalidRoot.children || [];
            invalidRoot.children.push(nodeCopy);
        }
        funcRoot.children = removeNodeFromTree(funcRoot.children || [], node.id);
        delete existingNodeMap[id];
    });

    function createTreeNode(rawNode) {
        return {
            id: rawNode.id,
            name: rawNode.name,
            type: 'func',
            children: [],
            expanded: false,
            visible: true
        };
    }

    function findAndAddNewNodes(newNodes, parentId) {
        newNodes.forEach(newNode => {
            if (!existingNodeMap[newNode.id]) {
                const newNodeCopy = createTreeNode(newNode);

                if (parentId === funcRoot.id) {
                    funcRoot.children = funcRoot.children || [];
                    funcRoot.children.push(newNodeCopy);
                    existingNodeMap[newNode.id] = { node: newNodeCopy, parentId: funcRoot.id };
                } else {
                    const parent = findNodeById(funcRoot.children || [], parentId);
                    if (parent) {
                        parent.children = parent.children || [];
                        parent.children.push(newNodeCopy);
                        existingNodeMap[newNode.id] = { node: newNodeCopy, parentId: parent.id };
                    }
                }
            }

            const childrenInNew = newMenuNodes.filter(n => n.parentId === newNode.id);
            if (childrenInNew.length > 0) {
                findAndAddNewNodes(childrenInNew, newNode.id);
            }
        });
    }

    const level1Nodes = newMenuNodes.filter(n => n.level === 1);
    findAndAddNewNodes(level1Nodes, funcRoot.id);

    return existingTree;
}

function cascadeVisibility(nodeId, visible) {
    const tree = getMenuTree();
    const node = findNodeById(tree, nodeId);

    if (node && node.children) {
        node.children.forEach(child => {
            saveNodeConfig(child.id, { ...getNodeConfig(child.id), visible: visible });
            cascadeVisibility(child.id, visible);
        });
    }
}

function deleteContentByNodeId(type, nodeId) {
    const content = getContent(type);
    if (content[nodeId]) {
        delete content[nodeId];
        saveContent(type, content);
    }
}

function regenerateNodeIds(node) {
    const oldId = node.id;
    node.id = 'invalid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const qaContent = getContent('qa');
    const manualContent = getContent('manual');
    const votes = getStorage(STORAGE_KEYS.VOTES) || {};
    const nodeConfig = getStorage(STORAGE_KEYS.NODE_CONFIG) || {};

    if (qaContent[oldId]) {
        qaContent[node.id] = qaContent[oldId];
        delete qaContent[oldId];
        setStorage(STORAGE_KEYS.QA_CONTENT, qaContent);
    }

    if (manualContent[oldId]) {
        manualContent[node.id] = manualContent[oldId];
        delete manualContent[oldId];
        setStorage(STORAGE_KEYS.MANUAL_CONTENT, manualContent);
    }

    if (votes[oldId]) {
        votes[node.id] = votes[oldId];
        delete votes[oldId];
        setStorage(STORAGE_KEYS.VOTES, votes);
    }

    if (nodeConfig[oldId]) {
        nodeConfig[node.id] = nodeConfig[oldId];
        delete nodeConfig[oldId];
        setStorage(STORAGE_KEYS.NODE_CONFIG, nodeConfig);
    }

    if (node.children && node.children.length > 0) {
        node.children = node.children.map(child => regenerateNodeIds(child));
    }

    return node;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showConfirmModal(message, onConfirm) {
    const modal = createModal('确认操作', `<p style="text-align:center;padding:20px;">${message}</p>`, [
        { text: '取消', class: 'btn-secondary', onClick: closeModal },
        { text: '确认', class: 'btn-primary', onClick: () => { closeModal(); onConfirm(); } }
    ]);
    document.getElementById('modalContainer').appendChild(modal);
}

function createModal(title, content, buttons) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">${content}</div>
            <div class="modal-footer"></div>
        </div>
    `;

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'btn ' + btn.class;
        button.textContent = btn.text;
        button.onclick = btn.onClick;
        modal.querySelector('.modal-footer').appendChild(button);
    });

    return modal;
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

function formatDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}