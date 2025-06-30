
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Search, Filter, Plus, MapPin, Bed, Bath, Square } from "lucide-react";

const Propriedades = () => {
  const properties = [
    {
      id: 1,
      title: "Apartamento Moderno no Centro",
      address: "Rua das Flores, 123 - Centro",
      price: "R$ 450.000",
      type: "Apartamento",
      status: "Disponível",
      bedrooms: 2,
      bathrooms: 2,
      area: "85m²",
      image: "/api/placeholder/300/200"
    },
    {
      id: 2,
      title: "Casa Térrea com Jardim",
      address: "Av. Principal, 456 - Jardins",
      price: "R$ 650.000",
      type: "Casa",
      status: "Vendido",
      bedrooms: 3,
      bathrooms: 2,
      area: "120m²",
      image: "/api/placeholder/300/200"
    },
    {
      id: 3,
      title: "Cobertura com Vista Mar",
      address: "Rua da Praia, 789 - Beira Mar",
      price: "R$ 1.200.000",
      type: "Cobertura",
      status: "Reservado",
      bedrooms: 4,
      bathrooms: 3,
      area: "180m²",
      image: "/api/placeholder/300/200"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disponível":
        return "bg-green-100 text-green-800";
      case "Vendido":
        return "bg-red-100 text-red-800";
      case "Reservado":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Propriedades</h1>
          <p className="text-gray-600 mt-1">Gerencie seu portfólio de imóveis</p>
        </div>
        <Button className="bg-imobipro-blue hover:bg-imobipro-blue-dark">
          <Plus className="w-4 h-4 mr-2" />
          Nova Propriedade
        </Button>
      </div>

      {/* Filters */}
      <Card className="imobipro-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por endereço, tipo ou características..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="cobertura">Cobertura</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: "847", color: "text-blue-600" },
          { label: "Disponíveis", value: "234", color: "text-green-600" },
          { label: "Vendidas", value: "456", color: "text-red-600" },
          { label: "Reservadas", value: "157", color: "text-yellow-600" },
        ].map((stat, index) => (
          <Card key={index} className="imobipro-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card key={property.id} className="imobipro-card overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <Badge 
                className={`absolute top-3 right-3 ${getStatusColor(property.status)}`}
              >
                {property.status}
              </Badge>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{property.title}</h3>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.address}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-imobipro-blue">{property.price}</span>
                  <Badge variant="outline">{property.type}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    {property.bedrooms}
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    {property.bathrooms}
                  </div>
                  <div className="flex items-center">
                    <Square className="w-4 h-4 mr-1" />
                    {property.area}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Detalhes
                  </Button>
                  <Button size="sm" className="flex-1 bg-imobipro-blue hover:bg-imobipro-blue-dark">
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Propriedades;
