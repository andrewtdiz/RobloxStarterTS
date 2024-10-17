interface Component {
	Create: (Tag: string, func: () => void) => void;
	Init: (ComponentsFolder: Folder) => void;
}

declare const Component: Component;

export = Component;
