# Guia do Usuário - Controle de Vendas Simplificado

Bem-vindo ao **Controle de Vendas Simplificado**! Este guia vai ajudá-lo a configurar e usar a aplicação.

## 📱 Acessar a Aplicação

A aplicação está disponível em: **[URL será fornecida]**

## 🚀 Primeiros Passos

### Passo 1: Registrar uma Venda (Sem Google Sheets)

Você pode começar a registrar vendas imediatamente, sem configurar o Google Sheets:

1. Clique no botão **"Registrar Nova Venda"** (botão laranja grande)
2. Preencha os dados da venda:
   - **Produto:** Selecione entre Gás 35kg, Gás 75kg ou Água 20L
   - **Forma de Pagamento:** Selecione entre Dinheiro, Pix ou Cartão
   - **Nome do Cliente:** Digite o nome de quem está comprando
   - **Endereço de Entrega:** (Opcional) Digite o endereço
   - **Telefone:** (Opcional) Digite o telefone do cliente
   - **Quantidade:** Número de unidades vendidas
   - **Valor Total:** Valor em reais (ex: 150.00)
   - **Observações:** (Opcional) Adicione qualquer observação importante
3. Clique em **"Salvar Venda"**

A venda será salva na aplicação e aparecerá na seção **"Últimas Vendas"** abaixo.

### Passo 2: Configurar o Google Sheets (Opcional mas Recomendado)

Para sincronizar automaticamente suas vendas com uma planilha do Google Sheets, siga os passos abaixo:

#### 2.1 Criar um Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com)
2. Clique em **"+ Criar"** para criar uma nova planilha
3. Dê um nome à planilha (ex: "Vendas 2025")
4. Na primeira linha, adicione os cabeçalhos (opcional, mas recomendado):
   - A1: Data/Hora
   - B1: Produto
   - C1: Cliente
   - D1: Endereço
   - E1: Telefone
   - F1: Quantidade
   - G1: Valor
   - H1: Pagamento
   - I1: Observações

#### 2.2 Criar um Google Apps Script

1. Na sua planilha, clique em **"Extensões"** > **"Apps Script"**
2. Apague o código padrão e cole o código abaixo:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp,
      data.product,
      data.clientName,
      data.address,
      data.phone,
      data.quantity,
      data.totalValue,
      data.payment,
      data.observations,
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({success: true}));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()}));
  }
}
```

3. Clique em **"Salvar"** (ícone de disquete)
4. Dê um nome ao projeto (ex: "Controle de Vendas")

#### 2.3 Publicar como Serviço Web

1. Clique em **"Deploy"** (botão azul no canto superior direito)
2. Clique em **"New deployment"** (ou "Criar implementação")
3. Selecione o tipo: **"Web app"**
4. Configure:
   - **Execute as:** Sua conta Google
   - **Who has access:** "Anyone"
5. Clique em **"Deploy"**
6. Uma janela aparecerá com a URL do serviço web. **Copie essa URL** (ela terá este formato):
   ```
   https://script.google.com/macros/d/[ID]/userweb/exec
   ```

#### 2.4 Configurar a URL na Aplicação

1. Volte para a aplicação **Controle de Vendas Simplificado**
2. Clique no botão **"Configurar Google Sheets"** (canto superior direito)
3. Cole a URL que você copiou do Apps Script
4. Clique em **"OK"**
5. O botão mudará para **"✓ Google Sheets Configurado"**

### Passo 3: Usar a Aplicação com Google Sheets

Agora, sempre que você registrar uma venda:

1. Os dados serão salvos **localmente** na aplicação (visível em "Últimas Vendas")
2. Os dados serão **automaticamente enviados** para sua planilha do Google Sheets
3. Você receberá uma mensagem confirmando o envio

## 📊 Visualizar Dados no Google Sheets

Acesse sua planilha do Google Sheets a qualquer momento para:

- **Visualizar** todas as vendas registradas
- **Filtrar** por produto, cliente, forma de pagamento, etc.
- **Criar gráficos** e análises
- **Exportar** os dados em Excel ou PDF
- **Compartilhar** com outras pessoas

## 🗑️ Deletar uma Venda

Para remover uma venda do histórico local:

1. Encontre a venda na seção **"Últimas Vendas"**
2. Clique no ícone de **lixeira** (canto superior direito do card)
3. A venda será removida da aplicação

**Nota:** Se a venda já foi enviada para o Google Sheets, você precisará deletá-la manualmente lá também.

## 💾 Dados Locais

Seus dados são salvos no **navegador** (localStorage). Isso significa:

- ✅ Funciona **offline** (sem internet)
- ✅ Os dados **persistem** mesmo após fechar o navegador
- ⚠️ Se você limpar o cache/histórico do navegador, os dados locais serão perdidos
- ✅ Os dados no Google Sheets **nunca serão perdidos** (estão na nuvem)

## ❓ Perguntas Frequentes

### P: Posso usar a aplicação sem configurar o Google Sheets?
**R:** Sim! Você pode registrar vendas e elas ficarão salvas localmente na aplicação. Mas recomendamos configurar o Google Sheets para ter um backup na nuvem.

### P: O que acontece se eu perder meu telefone/computador?
**R:** Se você configurou o Google Sheets, todos os seus dados estão salvos lá. Você pode acessar de qualquer dispositivo.

### P: Posso editar uma venda depois de registrá-la?
**R:** Atualmente, você pode deletar e registrar novamente. Estamos trabalhando em uma funcionalidade de edição.

### P: Posso compartilhar minha planilha com outras pessoas?
**R:** Sim! Abra o Google Sheets, clique em "Compartilhar" e adicione os emails das pessoas que você quer que vejam os dados.

### P: Posso adicionar mais produtos ou formas de pagamento?
**R:** Atualmente, os produtos e formas de pagamento são fixos. Nos avise se precisar adicionar mais opções!

## 🆘 Suporte

Se tiver dúvidas ou problemas:

1. Verifique se a URL do Google Apps Script está correta
2. Verifique se o Apps Script foi publicado como "Web app"
3. Tente atualizar a página (F5 ou Cmd+R)
4. Limpe o cache do navegador e tente novamente

---

**Versão:** 1.0  
**Data:** Dezembro 2025  
**Desenvolvido com ❤️ para simplificar seu controle de vendas**
