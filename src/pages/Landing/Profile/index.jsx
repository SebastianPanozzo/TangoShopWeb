// ===== COMPONENTE PROFILE =====
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import Loader from "../../../components/LoadAndErr/Loader";
import Error from "../../../components/LoadAndErr/Error";
import image from "../../../../public/img/bgHeader.jpeg"
import useFetchData from '../../../hooks/useFetchData';
import ProductList from "../../../components/ProductList";

// Modal para solicitar email
const EmailRequestModal = ({ onEmailSubmit, isVisible }) => {
  const modalRef = useRef();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVisible && modalRef.current) {
      const modal = new window.bootstrap.Modal(modalRef.current, {
        backdrop: false, // Elimina el fondo oscuro completamente
        keyboard: false
      });
      modal.show();
    }
  }, [isVisible]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor ingresa un email válido');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un formato de email válido');
      return;
    }

    setError('');
    onEmailSubmit(email.trim());
  };

  if (!isVisible) return null;

  return (
    <div
      className="modal fade"
      tabIndex="-1"
      aria-hidden="true"
      ref={modalRef}
      style={{ background: 'transparent' }} // Fondo transparente
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-info text-white">
            <h5 className="modal-title">Buscar Perfil</h5>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label text-info fw-bold">
                  <i className="fas fa-envelope me-2"></i>Correo Electrónico del Perfil
                </label>
                <input
                  type="email"
                  className="form-control border-info"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  autoFocus
                  required
                />
                <div className="form-text">Ingresa el email del perfil que deseas ver</div>
              </div>

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <div className="modal-footer border-0 px-0 pb-0">
                <button
                  type="submit"
                  className="btn btn-info fw-bold w-100"
                >
                  <i className="fas fa-search me-2"></i>Buscar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const navigateTo = useNavigate();
  const { email: urlEmail } = useParams();
  const [userData, setUserData] = useState(null);
  const [products, setProducts] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  // Fetch del usuario por email con sus productos guardados
  const { trigger, isMutating, error } = useFetchData('/api/findUsers');

  // Función para buscar usuario por email con sus productos
  const fetchUserByEmail = async (email) => {
    try {
      setSearchError('');
      const userQuery = [
        {
          "$match": {
            "email": { "$eq": email }
          }
        },
        {
          "$addFields": {
            "strId": {
              "$toString": "$_id"
            }
          }
        },
        {
          "$lookup": {
            "from": "relations",
            "localField": "strId",
            "foreignField": "from",
            "as": "saved_product",
            "pipeline": [
              {
                "$match": {
                  "type": "saved_product"
                }
              },
              {
                "$addFields": {
                  "objTo": {
                    "$toObjectId": "$to"
                  }
                }
              },
              {
                "$lookup": {
                  "from": "objects",
                  "localField": "objTo",
                  "foreignField": "_id",
                  "as": "product",
                  "pipeline": [
                    {
                      "$lookup": {
                        "from": "objecttypes",
                        "localField": "type",
                        "foreignField": "_id",
                        "as": "object_type"
                      }
                    },
                    {
                      "$unwind": "$object_type"
                    },
                    {
                      "$project": {
                        "name": 1,
                        "description": 1,
                        "type": 1,
                        "tags": 1,
                        "category": "$object_type.name",
                        "props": 1,
                        "published": "$updatedAt",
                        "createdAt": 1,
                        "status": 1,
                        "image": 1,
                        "price": 1,
                        "stock": 1,
                        "sku": 1,
                        "specifications": 1,
                        "object_type": "$object_type"
                      }
                    }
                  ]
                }
              },
              {
                "$unwind": "$product"
              },
              {
                "$project": {
                  "props": 1,
                  "product": 1
                }
              }
            ]
          }
        },
        {
          "$project": {
            "email": 1,
            "name": 1,
            "last_name": 1,
            "image": 1,
            "phone": 1,
            "birthdate": 1,
            "saved_product": 1
          }
        }
      ];

      const response = await trigger({
        method: 'POST',
        body: userQuery
      });

      if (response && response.items && response.items.length > 0) {
        const foundUser = response.items[0];
        
        // Verificar si el usuario tiene productos guardados
        if (!foundUser.saved_product || foundUser.saved_product.length === 0) {
          setSearchError('El usuario no tiene productos guardados');
          setShowEmailModal(false);
          setShowErrorMessage(true);
          
          // Después de 4 segundos, ocultar el mensaje de error y mostrar el modal nuevamente
          setTimeout(() => {
            setShowErrorMessage(false);
            setSearchError('');
            setShowEmailModal(true);
          }, 4000);
          return;
        }
        
        setUserData(foundUser);
        setShowEmailModal(false);
        
        // Actualizar URL con el email
        if (urlEmail !== email) {
          navigateTo(`/profile/${encodeURIComponent(email)}`, { replace: true });
        }
        
        // Procesar productos del usuario
        const userProducts = foundUser.saved_product.map(item => ({
          ...item.product,
          // Mantener información adicional si es necesaria
          profit_props: item.props
        }));
        
        setProducts({ items: userProducts });
      } else {
        setSearchError('No se encontró ningún usuario con ese email');
        setShowEmailModal(false);
        setShowErrorMessage(true);
        
        // Después de 4 segundos, ocultar el mensaje de error y mostrar el modal nuevamente
        setTimeout(() => {
          setShowErrorMessage(false);
          setSearchError('');
          setShowEmailModal(true);
        }, 4000);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setSearchError('Error al buscar el usuario. Por favor intenta nuevamente.');
      setShowEmailModal(false);
      setShowErrorMessage(true);
      
      // Después de 4 segundos, ocultar el mensaje de error y mostrar el modal nuevamente
      setTimeout(() => {
        setShowErrorMessage(false);
        setSearchError('');
        setShowEmailModal(true);
      }, 4000);
    }
  };

  // Manejar envío de email desde el modal
  const handleEmailSubmit = (email) => {
    fetchUserByEmail(email);
  };

  // Efecto inicial
  useEffect(() => {
    if (urlEmail) {
      // Si hay email en la URL, buscar directamente
      fetchUserByEmail(decodeURIComponent(urlEmail));
    } else {
      // Si no hay email en la URL, mostrar modal
      setShowEmailModal(true);
    }
  }, [urlEmail]);

  // Función para buscar otro perfil
  const handleSearchAnotherProfile = () => {
    setUserData(null);
    setProducts(null);
    setSearchError('');
    setShowErrorMessage(false);
    setShowEmailModal(true);
  };

  if (isMutating) return <Loader context={{ image }} />
  if (error && !userData) return <Error backgroundImage={image} />
  
  if (userData) {
    return (
      <div 
        className="position-relative"
        style={{
          height: '100vh',
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Contenedor con scroll */}
        <div 
          className="h-100 overflow-auto"
          style={{
            paddingTop: '20px',
            paddingBottom: '20px',
            paddingLeft: '8px',
            paddingRight: '8px',
            scrollBehavior: 'smooth'
          }}
        >
          <div className="container">
            <div className="row m-0 justify-content-center mb-2">
              <div className="col-12 p-0">
                {/* Botón para buscar otro perfil */}
                <div className="mb-3 text-end">
                  <button 
                    className="btn btn-outline-info"
                    onClick={handleSearchAnotherProfile}
                  >
                    <i className="fas fa-search me-2"></i>Buscar Otro Perfil
                  </button>
                </div>

                {/* Tarjeta de Perfil */}
                <div className="card shadow-sm border-0 w-100">
                  <div className="card-body p-4">
                    <div className="row">
                      {/* Columna Izquierda - Foto de Perfil */}
                      <div className="col-12 col-md-4 col-lg-3 text-center d-flex align-items-center justify-content-center mb-3">
                        <img
                          src={userData.image || "https://t3.ftcdn.net/jpg/00/64/67/80/360_F_64678017_zUpiZFjj04cnLri7oADnyMH0XBYyQghG.jpg"}
                          alt="Foto de perfil"
                          className="rounded-circle border border-info border-3"
                          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                        />
                      </div>
                      
                      {/* Columna Derecha - Información del Usuario */}
                      <div className="col-12 col-md-8 col-lg-9">
                        <div className="row g-3">
                          {/* Nombre completo */}
                          <div className="col-12">
                            <div className="shadow-sm bg-light p-3 rounded border-start border-info border-4">
                              <h3 className="text-info fw-bold mb-0">{userData.name} {userData.last_name}</h3>
                            </div>
                          </div>

                          {/* Información del usuario */}
                          <div className="col-12 col-lg-6">
                            <div className="shadow-sm bg-light p-2 rounded border-start border-info border-4">
                              <h6 className="text-info fw-bold mb-1" style={{ fontSize: '0.9rem' }}>
                                <i className="fas fa-calendar-alt me-2"></i>Fecha de Nacimiento
                              </h6>
                              <p className="mb-0 text-muted ps-2" style={{ fontSize: '0.95rem' }}>
                                {userData.birthdate
                                  ? new Date(userData.birthdate).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                  }).replace(/\//g, '/')
                                  : 'No especificada'
                                }
                              </p>
                            </div>
                          </div>

                          <div className="col-12 col-lg-6">
                            <div className="shadow-sm bg-light p-2 rounded border-start border-info border-4">
                              <h6 className="text-info fw-bold mb-1" style={{ fontSize: '0.9rem' }}>
                                <i className="fas fa-envelope me-2"></i>Correo Electrónico
                              </h6>
                              <p className="mb-0 text-muted ps-2" style={{ fontSize: '0.95rem' }}>{userData.email}</p>
                            </div>
                          </div>

                          <div className="col-12 col-lg-6">
                            <div className="shadow-sm bg-light p-2 rounded border-start border-info border-4">
                              <h6 className="text-info fw-bold mb-1" style={{ fontSize: '0.9rem' }}>
                                <i className="fas fa-phone me-2"></i>Número de Teléfono
                              </h6>
                              <p className="mb-0 text-muted ps-2" style={{ fontSize: '0.95rem' }}>{userData.phone || 'No especificado'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lista de Productos */}
            <div className="row m-0 justify-content-center mt-3">
              <div className="col-12 p-0">
                <ProductList 
                  products={products} 
                  error={null} 
                  isMutating={false}
                  userEmail={userData.email}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal para solicitar email */}
        <EmailRequestModal 
          onEmailSubmit={handleEmailSubmit}
          isVisible={showEmailModal}
        />
      </div>
    );
  }

  // Mostrar modal si no hay datos de usuario
  return (
    <div 
      className="vh-100 d-flex align-items-center justify-content-center position-relative"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <EmailRequestModal 
        onEmailSubmit={handleEmailSubmit}
        isVisible={showEmailModal}
      />
      
      {/* Mostrar mensaje de error por 4 segundos */}
      {showErrorMessage && searchError && (
        <div className="position-fixed top-50 start-50 translate-middle" style={{zIndex: 9999}}>
          <div className="alert alert-danger text-center shadow-lg" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {searchError}
          </div>
        </div>
      )}
    </div>
  );
}