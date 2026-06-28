import os
from PIL import Image

def generate_icons():
    logo_path = 'public/logo.jpg'
    if not os.path.exists(logo_path):
        print(f"Erro: {logo_path} não encontrado.")
        return

    # Abrir imagem base
    img = Image.open(logo_path)
    print(f"Processando imagem base: {logo_path} ({img.size} {img.format})")

    # Obter cor de fundo a partir do pixel superior esquerdo para preenchimento de ícones maskable
    bg_color = img.getpixel((0, 0))
    print(f"Cor de fundo detectada para preenchimento maskable: {bg_color}")

    # Tamanhos desejados
    sizes = {
        'icon-192x192.png': 192,
        'icon-512x512.png': 512,
        'apple-icon.png': 180
    }

    # 1. Gerar ícones padrão e iOS
    for filename, size in sizes.items():
        out_path = os.path.join('public', filename)
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(out_path, 'PNG')
        print(f"Gerado: {out_path} ({size}x{size})")

    # 2. Gerar ícones maskable (adicionando margem de segurança de ~15% em cada lado)
    # Para isso, redimensionamos o logo para 70% do tamanho final e colocamos no centro de uma tela com a cor de fundo bg_color
    maskable_sizes = {
        'icon-maskable-192x192.png': 192,
        'icon-maskable-512x512.png': 512
    }

    for filename, size in maskable_sizes.items():
        out_path = os.path.join('public', filename)
        # Criar nova imagem quadrada preenchida com a cor de fundo
        new_img = Image.new('RGB', (size, size), bg_color)
        
        # Redimensionar o logo original para 70% do tamanho
        logo_size = int(size * 0.7)
        resized_logo = img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # Calcular posição para colar no centro
        offset = (size - logo_size) // 2
        new_img.paste(resized_logo, (offset, offset))
        
        new_img.save(out_path, 'PNG')
        print(f"Gerado ícone adaptável (maskable): {out_path} ({size}x{size})")

if __name__ == '__main__':
    generate_icons()
