# Modelo 3D da Camiseta — tshirt.glb

Esta pasta deve conter o arquivo `tshirt.glb` — modelo 3D da camiseta em formato glTF binário.

## Convenção de nomes dos materiais (UV mapping)

O arquivo GLTF **precisa** ter os materiais com exatamente esses nomes para que o
ThreeDMockup.tsx aplique as texturas corretamente:

| Nome do Material    | Parte da Camiseta |
|---------------------|-------------------|
| `TShirt_Front`      | Frente            |
| `TShirt_Back`       | Costas            |
| `TShirt_SleeveRight`| Manga Direita     |
| `TShirt_SleeveLeft` | Manga Esquerda    |
| `TShirt_Base`       | Corpo base (cor sólida, sem textura de estampa) |

## Como obter o modelo

**Opção 1 — Gratuito (recomendado para começar):**
- Baixe em: https://sketchfab.com/search?q=t-shirt&features=downloadable&license=4
- Importe no Blender, configure os materiais com os nomes acima, exporte como `.glb`

**Opção 2 — Modelo premium:**
- MarvelousDesigner ou CLO3D podem gerar modelos com UV perfeito para estampas

**Opção 3 — Criar do zero no Blender:**
- Malha low-poly da camiseta
- UV unwrap separado para cada parte (frente, costas, mangas)
- 4 materiais com os nomes listados acima
- Exportar: File → Export → glTF 2.0 → formato Binary (.glb)

## Enquanto o modelo não está disponível

O ThreeDMockup.tsx exibe automaticamente um cubo placeholder com a cor da camiseta
e uma mensagem indicando que o modelo deve ser adicionado aqui.
