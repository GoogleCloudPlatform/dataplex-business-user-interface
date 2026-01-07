import { type GlossaryItem } from '../component/Glossaries/GlossaryDataType';

export const extractGlossaryId = (entryId: string): string | null => {
  const match = entryId.match(/(projects\/[^/]+\/locations\/[^/]+\/glossaries\/[^/]+)\/terms\//);
  return match ? match[1] : null;
};

export const normalizeId = (id: string) => {
  if (id.includes('/entries/')) {
    return id.split('/entries/')[1];
  }
  return id;
};

export const getAllAncestorIds = (items: GlossaryItem[], targetId: string): string[] => {
    const ancestors: string[] = [];
    const findPath = (nodes: GlossaryItem[], target: string, path: string[]) => {
        for (const node of nodes) {
            if (node.id === target) {
                ancestors.push(...path);
                return true;
            }
            if (node.children) {
                if (findPath(node.children, target, [...path, node.id])) return true;
            }
        }
        return false;
    };
    findPath(items, targetId, []);
    return ancestors;
};

export const findItem = (items: GlossaryItem[], id: string): GlossaryItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItem(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const getBreadcrumbs = (items: GlossaryItem[], targetId: string, chain: GlossaryItem[] = []): GlossaryItem[] | null => {
    for (const item of items) {
        if (item.id === targetId) return [...chain, item];
        if (item.children) {
            const found = getBreadcrumbs(item.children, targetId, [...chain, item]);
            if (found) return found;
        }
    }
    return null;
};

export const filterGlossaryTree = (nodes: GlossaryItem[], query: string): GlossaryItem[] => {
  return nodes.reduce((acc: GlossaryItem[], node) => {
    const filteredChildren = node.children ? filterGlossaryTree(node.children, query) : [];
    const matches = node.displayName.toLowerCase().includes(query.toLowerCase());
    
    if (matches || filteredChildren.length > 0) {
      acc.push({ 
        ...node, 
        children: matches && filteredChildren.length === 0 ? node.children : filteredChildren 
      });
    }
    return acc;
  }, []);
};

export const collectAllIds = (nodes: GlossaryItem[]): string[] => {
  let ids: string[] = [];
  nodes.forEach(node => {
    ids.push(node.id);
    if (node.children) ids = [...ids, ...collectAllIds(node.children)];
  });
  return ids;
};