const path = require('path');
const fs = require('fs').promises; 
const express = require('express');
const app = express();
const port = 4000;

class ProductManager {
    constructor(path) {
        this.path = path;
    }
    async loadProducts() {
        try {
            const data = await fs.readFile(this.path, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }
    async saveProducts(products) {
        try {
            await fs.writeFile(this.path, JSON.stringify(products, null, '\t'), 'utf8');
        } catch (error) {
            console.error('Error al guardar productos:', error);
        }
    }
    async addProduct(product) {
        if (!product.title || !product.description || !product.price || !product.thumbnail || !product.code || !product.stock) {
            console.log("Todos los campos son obligatorios");
            return;
        }

        const products = await this.loadProducts();
        
        if (products.some(existingProduct => existingProduct.code === product.code)) {
            console.log("El código del producto ya existe");
            return;
        }

        product.id = products.length + 1;
        products.push(product);

        this.saveProducts(products);
    }
    async deleteProduct(id) {
        const products = await this.loadProducts();
        const index = products.findIndex(product => product.id === id);
        if (index !== -1) {
            products.splice(index, 1);
            this.saveProducts(products); 
            console.log(`Producto con ID ${id} eliminado.`);
        } else {
            console.log("Producto no encontrado.");
        }
    }
    async updateProduct(id, updatedProduct) {
        const products = await this.loadProducts();
        const index = products.findIndex(product => product.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedProduct };
            this.saveProducts(products); 
            console.log(`Producto con ID ${id} actualizado.`);
        } else {
            console.log("Producto no encontrado.");
        }
    }
    async getProducts() {
        return await this.loadProducts();
    }
    async getProductById(id) {
        const products = await this.loadProducts();
        const product = products.find(product => product.id === id);
        if (!product) {
            console.log("Producto no encontrado");
        }
        return product;
    }
}

app.use(express.json());

const productManager = new ProductManager('./products.json');

app.get('/products', async (req, res) => {
    try {
        const limit = req.query.limit;
        const products = await productManager.getProducts();
        if (limit) {
            const limitedProducts = products.slice(0, parseInt(limit));
            res.json(limitedProducts);
        } else {
            res.json(products);
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

app.get('/products/:pid', async (req, res) => {
    const productId = parseInt(req.params.pid);

    if (!isNaN(productId)) {
        const product = await productManager.getProductById(productId);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } else {
        res.status(400).json({ error: 'ID de producto no válido' });
    }
});

app.listen(port, () => {
    console.log(`servidor express en ejecución en el puerto ${port}`);
});
