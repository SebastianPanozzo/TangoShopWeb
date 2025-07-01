import { useState, useMemo } from 'react';

function ProductList({ products, error, isMutating, userEmail }) {
    const [selectedCategory, setSelectedCategory] = useState("todas");

    // Obtener todas las categorías únicas de los productos guardados
    const categories = useMemo(() => {
        if (!products?.items?.length) return [];
        
        const categorySet = new Set();
        products.items.forEach(product => {
            const category = product.object_type?.name || product.category || 'Sin categoría';
            categorySet.add(category);
        });
        
        return Array.from(categorySet).sort();
    }, [products?.items]);

    // Filtrar productos guardados por categoría seleccionada
    const productsFiltered = useMemo(() => {
        if (!products?.items?.length) return [];
        
        if (selectedCategory === "todas") {
            return products.items;
        }
        
        return products.items.filter(product => {
            const productCategory = product.object_type?.name || product.category || 'Sin categoría';
            return productCategory === selectedCategory;
        });
    }, [products?.items, selectedCategory]);

    return (
        <div className="row m-0 py-3 card">
            <div className="col-12">
                <div className="shadow-sm bg-info p-3 text-white rounded d-flex align-items-center justify-content-between">
                    <h4>Productos publicados por el usuario: </h4>
                    {products?.items?.length > 0 && (
                        <div className="dropdown-center">
                            <button className="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Filtrar por:
                            </button>
                            <ul className="dropdown-menu">
                                <li>
                                    <a 
                                        className={`dropdown-item ${selectedCategory === "todas" ? "active" : ""}`} 
                                        href="#" 
                                        onClick={() => setSelectedCategory("todas")}
                                    >
                                        Todas las categorías
                                    </a>
                                </li>
                                {categories.length > 0 && (
                                    <>
                                        <li><hr className="dropdown-divider" /></li>
                                        {categories.map(category => (
                                            <li key={category}>
                                                <a 
                                                    className={`dropdown-item ${selectedCategory === category ? "active" : ""}`} 
                                                    href="#" 
                                                    onClick={() => setSelectedCategory(category)}
                                                >
                                                    {category}
                                                </a>
                                            </li>
                                        ))}
                                    </>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                {/* Mostrar información del filtro aplicado */}
                {selectedCategory !== "todas" && products?.items?.length > 0 && (
                    <div className="mt-2">
                        <span className="badge bg-primary">
                            Mostrando categoría: {selectedCategory} ({productsFiltered.length} productos publicados)
                        </span>
                    </div>
                )}
            </div>
            {isMutating && (
                <div className="col-12 mt-3">
                    <div className="p-5 alert alert-info text-center mb-0 text-info shadow-sm" role="alert">
                        <p className="fs-6 fw-bold">Buscando productos publicados</p>
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            )}
            {(products && !isMutating) && (
                <div className="col-12">
                    {productsFiltered.length > 0 ? (
                        <div 
                            style={{ 
                                maxHeight: '600px', 
                                overflowY: 'auto',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#6c757d #f8f9fa'
                            }}
                            className="pe-2"
                        >
                            <DropProduct products={productsFiltered} />
                        </div>
                    ) : (
                        <div className="col-12 mt-3">
                            <div className="p-5 alert alert-primary text-center mb-0 shadow-sm" role="alert">
                                <p className="fs-6 fw-bold">
                                    {selectedCategory === "todas" 
                                        ? "El usuario no tiene productos guardados aun" 
                                        : `No hay productos guardados en la categoría "${selectedCategory}"`
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {error && (
                <div className="col-12 mt-3">
                    <div className="p-5 alert alert-primary text-center mb-0 text-primary shadow-sm" role="alert">
                        <p className="fs-6 fw-bold">Error al buscar los productos publicados</p>
                    </div>
                </div>
            )}
        </div>
    );
};

function DropProduct({ products }) {
    const [openAccordion, setOpenAccordion] = useState();

    // Función para obtener la imagen del producto guardado
    const getProductImage = (producto) => {
        // Prioridad: props.images[0] > image > placeholder
        if (producto.props?.images && producto.props.images.length > 0) {
            return producto.props.images[0];
        }
        if (producto.image) {
            return producto.image;
        }
        // Placeholder más confiable
        return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbjwvdGV4dD4KPC9zdmc+";
    };

    // Función para obtener el precio del producto guardado
    const getProductPrice = (producto) => {
        // Prioridad: props.price > price > 0
        if (producto.props?.price !== undefined && producto.props.price !== null) {
            return producto.props.price;
        }
        if (producto.price !== undefined && producto.price !== null) {
            return producto.price;
        }
        return 0;
    };

    return (
        <div className="accordion" id="accordionProductos">
            {products.map((producto) => {
                const productPrice = getProductPrice(producto);
                const productImage = getProductImage(producto);
                
                return (
                    <div className="accordion-item shadow-sm border-0 mt-3 bg-info rounded" key={producto._id}>
                        <div className="accordion-header rounded">
                            <button
                                className={`p-2 rounded-3 bg-primary shadow-sm accordion-button ${openAccordion === producto._id ? '' : 'collapsed'}`}
                                type="button"
                                onClick={() => setOpenAccordion(openAccordion === producto._id ? null : producto._id)}
                                aria-expanded={openAccordion === producto._id}
                                aria-controls={`collapse-${producto._id}`}
                            >
                                <div className="row col-12 w-100 pe-2">
                                    <div className='col-2 d-flex'>
                                        <GetStatus status={producto.status || 'active'} />
                                    </div>
                                    <div className='col-12 col-md-10 text-start text-md-end'>
                                        <p className='text-muted m-0 lh-base'>Producto publicado el {formatDate(producto.createdAt)}</p>
                                    </div>
                                    <div className='col-12 lh-base mt-2'>
                                        <p className='m-0 fs-6'><i className="bi bi-box-seam me-2"></i>{producto.name}</p>
                                        <p className='m-0 text-muted'><i className="bi bi-currency-dollar me-2"></i>$ {productPrice?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                        <div
                            id={`collapse-${producto._id}`}
                            className={`accordion-collapse collapse ${openAccordion === producto._id ? 'show' : ''}`}
                        >
                            <div className="accordion-body p-3">
                                <div className="card border-0 mb-3 bg-primary shadow-sm rounded">
                                    <div className="card-body p-3">
                                        <div className="row">
                                            <div className="col-md-3 col-lg-2 text-center">
                                                <div style={{ height: "110px" }}>
                                                    <img
                                                        src={productImage}
                                                        alt={producto.name}
                                                        className='img-fluid rounded-3 shadow-sm'
                                                        style={{
                                                            height: "100%",
                                                            width: "100%",
                                                            objectFit: "cover",
                                                            backgroundPosition: "center",
                                                            backgroundRepeat: "no-repeat"
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgeG tcz0Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbjwvdGV4dD4KPC9zdmc+";
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="d-flex flex-column justify-content-between col-md-9 col-lg-10 mt-2 mt-md-0">
                                                <div>
                                                    <h4 className="card-title fw-bold text-white m-0">{producto.name}</h4>
                                                    <p className="text-white m-0 fs-6">
                                                        <strong className='text-white'>Categoría: </strong>
                                                        {producto.object_type?.name || producto.category || 'Sin categoría'}
                                                    </p>
                                                    {producto.description && (
                                                        <p className="text-white m-0 fs-6 mt-2">
                                                            <strong className='text-white'>Descripción: </strong>
                                                            {producto.description}
                                                        </p>
                                                    )}
                                                    {/* Mostrar información adicional de props */}
                                                    {producto.props?.brand && (
                                                        <p className="text-white m-0 fs-6">
                                                            <strong className='text-white'>Marca: </strong>
                                                            {producto.props.brand}
                                                        </p>
                                                    )}
                                                    {producto.props?.model && (
                                                        <p className="text-white m-0 fs-6">
                                                            <strong className='text-white'>Modelo: </strong>
                                                            {producto.props.model}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className='d-flex justify-content-between align-items-end mt-3'>
                                                    <div>
                                                        {producto.stock !== undefined && (
                                                            <p className="text-white m-0 fs-6">
                                                                <i className="bi bi-boxes me-2"></i>
                                                                Stock: {producto.stock}
                                                            </p>
                                                        )}
                                                        {producto.sku && (
                                                            <p className="text-white m-0 fs-6">
                                                                <i className="bi bi-upc-scan me-2"></i>
                                                                SKU: {producto.sku}
                                                            </p>
                                                        )}
                                                        {producto.props?.warranty_months && (
                                                            <p className="text-white m-0 fs-6">
                                                                <i className="bi bi-shield-check me-2"></i>
                                                                Garantía: {producto.props.warranty_months} meses
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="m-0 fs-5 fw-bold">
                                                        <strong className='text-white'>$ </strong>
                                                        <span className='text-white'>{productPrice?.toLocaleString() || '0'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mostrar especificaciones desde props */}
                                {producto.props && Object.keys(producto.props).length > 0 && (
                                    <div className='card border-0 mb-3 bg-info shadow-sm rounded p-3'>
                                        <h6 className='border-bottom pb-1 mb-2 text-white'>Especificaciones:</h6>
                                        {Object.entries(producto.props).map(([key, value]) => {
                                            // Excluir algunos campos que ya se muestran arriba
                                            if (['name', 'brand', 'model', 'price', 'images'].includes(key)) {
                                                return null;
                                            }
                                            
                                            // Formatear valores especiales
                                            let formattedValue = value;
                                            if (typeof value === 'object' && value !== null) {
                                                if (key === 'release_date') {
                                                    formattedValue = `${value.day}/${value.month}/${value.year}`;
                                                } else if (key === 'dimensions_cm') {
                                                    formattedValue = `${value.width} x ${value.height} x ${value.depth} cm`;
                                                } else {
                                                    formattedValue = JSON.stringify(value);
                                                }
                                            } else if (key === 'weight_kg') {
                                                formattedValue = `${value} kg`;
                                            } else if (key === 'warranty_months') {
                                                formattedValue = `${value} meses`;
                                            }
                                            
                                            return (
                                                <div key={key} className='d-flex justify-content-between align-items-center mb-1'>
                                                    <p className='text-white m-0 text-capitalize'>{key.replace(/_/g, ' ')}:</p>
                                                    <p className='fs-6 m-0 text-white'>{formattedValue}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Mostrar especificaciones originales si existen */}
                                {producto.specifications && Object.keys(producto.specifications).length > 0 && (
                                    <div className='card border-0 mb-3 bg-info shadow-sm rounded p-3'>
                                        <h6 className='border-bottom pb-1 mb-2 text-white'>Especificaciones Adicionales:</h6>
                                        {Object.entries(producto.specifications).map(([key, value]) => (
                                            <div key={key} className='d-flex justify-content-between align-items-center mb-1'>
                                                <p className='text-white m-0'>{key}:</p>
                                                <p className='fs-6 m-0 text-white'>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Mostrar galería de imágenes si hay más de una */}
                                {producto.props?.images && producto.props.images.length > 1 && (
                                    <div className='card border-0 mb-3 bg-info shadow-sm rounded p-3'>
                                        <h6 className='border-bottom pb-1 mb-2 text-white'>Galería de Imágenes:</h6>
                                        <div className='row'>
                                            {producto.props.images.slice(1).map((img, index) => (
                                                <div key={index} className='col-6 col-md-3 mb-2'>
                                                    <img
                                                        src={img}
                                                        alt={`${producto.name} - Imagen ${index + 2}`}
                                                        className='img-fluid rounded shadow-sm'
                                                        style={{
                                                            height: "80px",
                                                            width: "100%",
                                                            objectFit: "cover"
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const GetStatus = ({ status }) => {
    switch (status) {
        case 'active':
            return (
                <div className='d-flex badge rounded-pill p-2 px-3 bg-success bg-opacity-75'>
                    <i className="bi bi-check-circle"></i><p className='m-0 ms-2'>Activo</p>
                </div>
            );
        case 'inactive':
            return (
                <div className='d-flex badge rounded-pill p-2 px-3 bg-warning bg-opacity-75'>
                    <i className="bi bi-pause-circle"></i><p className='m-0 ms-2'>Inactivo</p>
                </div>
            );
        case 'discontinued':
            return (
                <div className='d-flex badge rounded-pill p-2 px-3 bg-danger bg-opacity-75'>
                    <i className="bi bi-x-circle"></i><p className='m-0 ms-2'>Descontinuado</p>
                </div>
            );
        default:
            return (
                <div className='d-flex badge rounded-pill p-2 px-3 bg-info bg-opacity-75'>
                    <i className="bi bi-info-circle"></i><p className='m-0 ms-2'>Activo</p>
                </div>
            );
    }
}

//Funciones Auxiliares
const formatDate = (fechaIsoUtc) => {
    const fecha = new Date(fechaIsoUtc);
    return `${fecha.getDate()} de ${new Intl.DateTimeFormat(`es-Ar`, { month: 'long' }).format(fecha)} de ${fecha.getFullYear()}`
}

export default ProductList;