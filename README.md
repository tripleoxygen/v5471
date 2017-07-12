# Pace V5471 42k Series

42k Series Custom firmware for Pace V5471 xDSL Modem

(c) 2016-2017 [Triple Oxygen](https://www.tripleoxygen.net)

## ATENÇÃO!

É sempre arriscado editar e criar imagens custom para o aparelho. Algumas situações são complicadas de resolver quando uma imagem problemática é gravada.

O uso dessas informações e ferramentas é **por sua conta e risco**.

### Como construir uma imagem

* Clone este repo
* Escolha a versão base da imagem e baixe o rootfs [daqui](https://www.tripleoxygen.net/files/devices/pace/v5471/firmware/custom/rootfs/)
* Coloque o rootfs baixado na raiz do projeto
* Execute (substitua a versão pelo número do rootfs (e.g.: 42006, 42007, ...). Aqui vamos usar a 42007 como exemplo):
  ```
  sudo ./unpack_rootfs.sh 42007
  ```
  * **Atenção**: é importante descompactar o rootfs como root para que os devs (/dev/) possam ser criados com sucesso!
* O conteúdo do rootfs estará em `squashfs-root`, faça suas modificações nesta pasta
* Execute
  ```
  ./build.sh 42007
  ```
* A imagem gerada estará em `build/42007/` com a extensão `.bin`
* Esta imagem ainda precisa ser corrigida utilizando o `firmInfo_r2.py`.

#### Inserção manual dos tamanhos das partições

**Script as is**. Infelizmente não tenho a versão mais atualizada do script `firmInfo_r2.py` (devo ter sobrescrito em algum momento) que faz tudo sozinho. Esta versão é mais "manual", quem puder atualizá-la, ficaria grato. É simples.

* Na pasta de saída `build/42007/`, obtenha o tamanho dos arquivos `rootfs.patched` e da imagem final `.bin` (e.g.: B14103-GVT-OXY-42007.bin)
  * Exemplo
    ```
    $ ls -l *.bin rootfs.patched
    -rw-r--r-- 1 ... 14815232 Jul 11 21:09 B14103-GVT-OXY-42007.bin
    -rw-r--r-- 1 ... 12677120 Jul 11 21:06 rootfs.patched
    ```
* Edite a imagem `.bin` de saída com um editor hexadecimal, indo nos offsets especificados e editando (sobrescreva, não insira!):
```
  Offset 0x40c (4 bytes) - Tamanho total da imagem `.bin`, big-endian
  Offset 0x57c (4 bytes) - Tamanho do `rootfs.patched`, big-endian
```
  * Exemplo
    ```
    Offset 0x40c = 00 E2 10 00 (14815232 em hex, big-endian)
    Offset 0x57c = 00 C1 70 00 (12677120 em hex, big-endian)
    ```
* Salve o arquivo, execute o `firmInfo_r2.py` na imagem `.bin` alterada acima:
  ```
  python firmInfo_r2.py B14103-GVT-OXY-42007.bin
  ```
* A imagem resultante com `-fixed-header.bin` estará pronta para ser gravada no modem.
