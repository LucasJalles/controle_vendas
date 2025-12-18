import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  productId: string;
  quantity: number;
  price: number; // Preço unitário
}

interface Sale {
  id: string;
  items: CartItem[];
  payment: string;
  clientName: string;
  address: string;
  phone: string;
  deliveryPerson: string;
  deliveryValue: number;
  totalValue: number;
  observations: string;
  timestamp: Date;
}

const PRODUCTS = [
  { id: "gas35", label: "Gás 35kg", icon: "🔥", basePrice: 90 },
  { id: "gas75", label: "Gás 75kg", icon: "🔥", basePrice: 140 },
  { id: "water", label: "Água 20L", icon: "💧", basePrice: 15 },
];

const PAYMENT_METHODS = [
  { id: "cash", label: "Dinheiro", icon: "💵", surcharge: 0 },
  { id: "pix", label: "Pix", icon: "📱", surcharge: 0 },
  { id: "card", label: "Cartão", icon: "💳", surcharge: 5 },
];

const DELIVERY_PERSONS = [
  { id: "person1", label: "Entregador 1" },
  { id: "person2", label: "Entregador 2" },
  { id: "person3", label: "Entregador 3" },
];

export default function Home() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryValue, setDeliveryValue] = useState("5.00");
  const [observations, setObservations] = useState("");
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  // Carregar URL do Google Sheets do localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem("googleSheetsUrl");
    if (savedUrl) {
      setGoogleSheetsUrl(savedUrl);
    }
  }, []);

  const getProductPrice = (productId: string): number => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return 0;
    
    const surcharge = PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.surcharge || 0;
    return product.basePrice + surcharge;
  };

  const addProductToCart = (productId: string) => {
    const price = getProductPrice(productId);
    const existingItem = cart.find((item) => item.productId === productId);
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1, price }
            : item
        )
      );
    } else {
      setCart([...cart, { productId, quantity: 1, price }]);
    }
    toast.success("Produto adicionado ao carrinho");
  };

  const removeProductFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
    toast.success("Produto removido do carrinho");
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromCart(productId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateCartPrice = (productId: string, newPrice: number) => {
    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, price: newPrice } : item
      )
    );
  };

  const getProductLabel = (productId: string) => {
    return PRODUCTS.find((p) => p.id === productId)?.label || "";
  };

  const getProductIcon = (productId: string) => {
    return PRODUCTS.find((p) => p.id === productId)?.icon || "";
  };

  const calculateCartTotal = (): number => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handlePaymentChange = (paymentId: string) => {
    setSelectedPayment(paymentId);
    // Atualizar preços dos itens no carrinho quando mudar a forma de pagamento
    const updatedCart = cart.map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      if (!product) return item;
      
      const surcharge = PAYMENT_METHODS.find((m) => m.id === paymentId)?.surcharge || 0;
      return { ...item, price: product.basePrice + surcharge };
    });
    setCart(updatedCart);
  };

  const handleSaveSale = async () => {
    if (cart.length === 0 || !selectedPayment || !clientName || !selectedDeliveryPerson) {
      toast.error("Preencha todos os campos obrigatórios e adicione pelo menos um produto");
      return;
    }

    const deliveryVal = parseFloat(deliveryValue) || 5;
    const cartTotal = calculateCartTotal();
    const totalValue = cartTotal + deliveryVal;

    const newSale: Sale = {
      id: Date.now().toString(),
      items: cart,
      payment: PAYMENT_METHODS.find((p) => p.id === selectedPayment)?.label || "",
      clientName,
      address,
      phone,
      deliveryPerson: DELIVERY_PERSONS.find((p) => p.id === selectedDeliveryPerson)?.label || "",
      deliveryValue: deliveryVal,
      totalValue,
      observations,
      timestamp: new Date(),
    };

    setSales([newSale, ...sales]);

    // Enviar para Google Sheets se a URL estiver configurada
    if (googleSheetsUrl) {
      setIsSending(true);
      try {
        await sendToGoogleSheets(newSale);
        toast.success("Venda salva e enviada para o Google Sheets!");
      } catch (error) {
        console.error("Erro ao enviar para Google Sheets:", error);
        toast.error("Venda salva localmente, mas houve erro ao enviar para o Google Sheets.");
      } finally {
        setIsSending(false);
      }
    } else {
      toast.success("Venda salva localmente. Configure o Google Sheets para sincronizar.");
    }

    handleCancelModal();
  };

  const sendToGoogleSheets = async (sale: Sale) => {
    if (!googleSheetsUrl) return;

    const itemsDescription = sale.items
      .map((item) => `${item.quantity}x ${getProductLabel(item.productId)} (R$ ${item.price.toFixed(2)})`)
      .join(" + ");

    const payload = {
      timestamp: sale.timestamp.toLocaleString("pt-BR"),
      items: itemsDescription,
      clientName: sale.clientName,
      address: sale.address,
      phone: sale.phone,
      deliveryPerson: sale.deliveryPerson,
      deliveryValue: sale.deliveryValue,
      totalValue: sale.totalValue,
      payment: sale.payment,
      observations: sale.observations,
    };

    const response = await fetch(googleSheetsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok && response.status !== 0) {
      throw new Error(`Erro ao enviar dados: ${response.statusText}`);
    }
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setCart([]);
    setSelectedPayment("");
    setSelectedDeliveryPerson("");
    setClientName("");
    setAddress("");
    setPhone("");
    setDeliveryValue("5.00");
    setObservations("");
  };

  const handleConfigureGoogleSheets = () => {
    const url = prompt(
      "Cole a URL do Google Apps Script publicado (URL do serviço web):",
      googleSheetsUrl
    );
    if (url) {
      setGoogleSheetsUrl(url);
      localStorage.setItem("googleSheetsUrl", url);
      toast.success("Google Sheets configurado com sucesso!");
    }
  };

  const handleDeleteSale = (id: string) => {
    setSales(sales.filter((sale) => sale.id !== id));
    toast.success("Venda removida");
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Controle de Vendas</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas vendas de forma simples e organizada</p>
          </div>
          <Button
            variant="outline"
            onClick={handleConfigureGoogleSheets}
            className="rounded-lg"
          >
            {googleSheetsUrl ? "✓ Google Sheets Configurado" : "Configurar Google Sheets"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Action Card */}
        <div className="mb-8 flex justify-center">
          <Card className="w-full max-w-md border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-primary text-2xl">Nova Venda</CardTitle>
              <CardDescription>Registre um novo pedido rapidamente</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full h-12 text-base font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-105"
              >
                <Plus className="mr-2 h-5 w-5" />
                Registrar Nova Venda
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-primary text-2xl">Registrar Nova Venda</DialogTitle>
              <DialogDescription>Preencha as informações abaixo para registrar a venda</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Produtos */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Produtos *</Label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {PRODUCTS.map((product) => (
                    <Button
                      key={product.id}
                      onClick={() => addProductToCart(product.id)}
                      variant={cart.some((item) => item.productId === product.id) ? "default" : "outline"}
                      className="h-20 flex flex-col items-center justify-center rounded-lg border-2 transition-all"
                    >
                      <span className="text-2xl">{product.icon}</span>
                      <span className="text-xs mt-1 text-center">{product.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Carrinho */}
                {cart.length > 0 && (
                  <Card className="bg-muted/50 p-4 rounded-lg">
                    <Label className="text-sm font-semibold mb-3 block">Itens no Carrinho:</Label>
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.productId} className="bg-background p-3 rounded border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-2 font-semibold">
                              <span className="text-lg">{getProductIcon(item.productId)}</span>
                              <span>{getProductLabel(item.productId)}</span>
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeProductFromCart(item.productId)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <Label className="text-xs text-muted-foreground">Quantidade</Label>
                              <div className="flex items-center gap-1 mt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                                  className="h-6 w-6 p-0"
                                >
                                  -
                                </Button>
                                <span className="w-6 text-center font-semibold">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                                  className="h-6 w-6 p-0"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-muted-foreground">Preço Unit.</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateCartPrice(item.productId, parseFloat(e.target.value) || 0)}
                                className="h-8 mt-1 text-sm"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs text-muted-foreground">Subtotal</Label>
                              <div className="h-8 mt-1 flex items-center font-semibold text-primary">
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="bg-primary/10 p-3 rounded border border-primary/20">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total dos Produtos:</span>
                          <span className="text-primary font-bold text-lg">R$ {calculateCartTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Forma de Pagamento */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Forma de Pagamento *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <Button
                      key={method.id}
                      onClick={() => handlePaymentChange(method.id)}
                      variant={selectedPayment === method.id ? "default" : "outline"}
                      className="h-16 flex flex-col items-center justify-center rounded-lg border-2 transition-all"
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="text-xs mt-1">{method.label}</span>
                      {method.surcharge > 0 && (
                        <span className="text-xs text-muted-foreground">+R$ {method.surcharge}</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Entregador */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Entregador *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {DELIVERY_PERSONS.map((person) => (
                    <Button
                      key={person.id}
                      onClick={() => setSelectedDeliveryPerson(person.id)}
                      variant={selectedDeliveryPerson === person.id ? "default" : "outline"}
                      className="h-16 flex flex-col items-center justify-center rounded-lg border-2 transition-all"
                    >
                      <span className="text-2xl">👤</span>
                      <span className="text-xs mt-1 text-center">{person.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Dados do Cliente */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="clientName" className="text-base font-semibold mb-2 block">
                    Nome do Cliente *
                  </Label>
                  <Input
                    id="clientName"
                    placeholder="Digite o nome do cliente"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="rounded-lg border-2 border-border focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-base font-semibold mb-2 block">
                    Endereço de Entrega
                  </Label>
                  <Input
                    id="address"
                    placeholder="Digite o endereço (opcional)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="rounded-lg border-2 border-border focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-base font-semibold mb-2 block">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(XX) XXXXX-XXXX (opcional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-lg border-2 border-border focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="deliveryValue" className="text-base font-semibold mb-2 block">
                    Valor da Entrega (R$)
                  </Label>
                  <Input
                    id="deliveryValue"
                    type="number"
                    step="0.01"
                    placeholder="5.00"
                    value={deliveryValue}
                    onChange={(e) => setDeliveryValue(e.target.value)}
                    className="rounded-lg border-2 border-border focus:border-primary"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observations" className="text-base font-semibold mb-2 block">
                  Observações
                </Label>
                <Textarea
                  id="observations"
                  placeholder="Adicione observações sobre a venda (opcional)"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="rounded-lg border-2 border-border focus:border-primary"
                  rows={3}
                />
              </div>

              {/* Resumo Final */}
              {cart.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Produtos:</span>
                        <span className="font-semibold">R$ {calculateCartTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entrega:</span>
                        <span className="font-semibold">R$ {parseFloat(deliveryValue || "0").toFixed(2)}</span>
                      </div>
                      <div className="border-t border-primary/20 pt-2 flex justify-between text-lg">
                        <span className="font-bold">Total:</span>
                        <span className="text-primary font-bold">R$ {(calculateCartTotal() + parseFloat(deliveryValue || "0")).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCancelModal}
                  variant="outline"
                  className="flex-1 rounded-lg h-10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveSale}
                  disabled={isSending}
                  className="flex-1 rounded-lg h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSending ? "Enviando..." : "Salvar Venda"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Últimas Vendas */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Últimas Vendas</h2>
          {sales.length === 0 ? (
            <Card className="border-2 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-muted-foreground text-center">
                  Nenhuma venda registrada ainda. Clique em "Registrar Nova Venda" para começar!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sales.map((sale) => (
                <Card key={sale.id} className="border-2 border-border/50 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-primary text-lg">
                        {sale.items.map((item) => `${item.quantity}x ${getProductIcon(item.productId)}`).join(" + ")}
                      </CardTitle>
                      <CardDescription>{formatDate(sale.timestamp)}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSale(sale.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-foreground">Cliente:</span>
                      <span className="text-muted-foreground ml-2">{sale.clientName}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Itens:</span>
                      <div className="text-muted-foreground ml-2 text-xs space-y-1">
                        {sale.items.map((item) => (
                          <div key={item.productId}>
                            {item.quantity}x {getProductLabel(item.productId)} - R$ {item.price.toFixed(2)} cada
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Entregador:</span>
                      <span className="text-muted-foreground ml-2">{sale.deliveryPerson}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Entrega:</span>
                      <span className="text-muted-foreground ml-2">R$ {sale.deliveryValue.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Valor Total:</span>
                      <span className="text-primary font-bold ml-2">R$ {sale.totalValue.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Pagamento:</span>
                      <span className="text-muted-foreground ml-2">{sale.payment}</span>
                    </div>
                    {sale.address && (
                      <div>
                        <span className="font-semibold text-foreground">📍 {sale.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
