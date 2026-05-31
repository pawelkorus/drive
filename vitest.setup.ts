import '@testing-library/jest-dom/vitest'

// Polyfill for DataTransfer and DragEvent in jsdom
if (typeof DataTransfer === 'undefined') {
  class DataTransferItem {
    constructor(private file: File) {}

    get kind() {
      return 'file'
    }

    getAsFile() {
      return this.file
    }
  }

  class DataTransferItemList {
    private items: DataTransferItem[] = []

    add(file: File) {
      this.items.push(new DataTransferItem(file))
      // Add numeric index properties
      ;(this as any)[this.items.length - 1] = this.items[this.items.length - 1]
    }

    clear() {
      this.items = []
    }

    remove(index: number) {
      this.items.splice(index, 1)
    }

    get length() {
      return this.items.length
    }

    [Symbol.iterator]() {
      return this.items[Symbol.iterator]()
    }
  }

  (global as any).DataTransfer = class DataTransfer {
    items = new DataTransferItemList()
    dropEffect = 'none'
    effectAllowed = 'uninitialized'
    files = []
    types = []
    getData: (format: string) => ''
    setData: (format: string, data: string) => {}
    setDragImage: (image: any, x: number, y: number) => {}
    clearData: (format?: string) => {}
  }
}

if (typeof DragEvent === 'undefined') {
  (global as any).DragEvent = class DragEvent extends Event {
    dataTransfer: any
    constructor(type: string, eventInitDict?: any) {
      super(type, eventInitDict)
      this.dataTransfer = eventInitDict?.dataTransfer || new (global as any).DataTransfer()
    }
  }
}
