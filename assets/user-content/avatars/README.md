# Avatares públicos

Esta pasta contém **somente avatares públicos otimizados** (atualmente WebP,
quadrados, até 256×256). Arquivos originais, metadata/EXIF, nomes de usuário,
e dados de conta nunca devem ser gravados aqui.

O armazenamento atual usa `GitHubAvatarStorage`, por meio do Worker autenticado.
O Git manté o histórico das versões substituídas; portanto, esta solução é
adequada somente para uma base pequena ou moderada. A interface conceitual
`AvatarStorage` (`save`, `delete`, `getUrl`) permite migrar para
`R2AvatarStorage`/Backblaze sem mudar as APIs ou a tela de Perfil.

Nunca coloque tokens nesta pasta ou no frontend. `GITHUB_AVATAR_TOKEN` deve ser
um Secret do Cloudflare com permissão **Contents: read/write** apenas neste
repositório.
