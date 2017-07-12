#! /usr/bin/python

#
# Based on https://github.com/trndr/ARVx510-tools/blob/master/fixBinaryHeader.py
#
# Work by fgrep && Triple Oxygen
#

import hashlib
import sys
def readAsWord(array, ofset=0):
  out=0
  for i in range(4):
    out=out<<8
    out+=array[ofset+i]
  return(out)
def writeAsWord(number, array, ofset):
  for i in range(4):
    tmp=number&0xFF
    array[(ofset+3-i)]=tmp
    number = number>>8
def readAsString(array, len, ofset=0):
  out=0
  for i in range(len):
    out=out<<8
    out+=array[ofset+i]

  chars_in_reverse = []
  while out != 0x0:
    chars_in_reverse.append(chr(out & 0xFF))
    out = out >> 8

  chars_in_reverse.reverse()
  return ''.join(chars_in_reverse)
def md5sum(filename):
  md5 = hashlib.md5()
  with open(filename,'rb') as f:
    for chunk in iter(lambda: f.read(128*md5.block_size), b''):
      md5.update(chunk)
  return md5.hexdigest()

# Magics para os 0xB14103 (existe para outros no fwburn, but why bother)
stupidMagicArray={0x00B14103:[0x0a202042, 0x7c2261db, 0x1278b29b, 0x27b2ce31]}

if (len(sys.argv)>1):
  fileInputName=sys.argv[1]
  print("Using file       : " + fileInputName)
  fileInput=open(fileInputName, 'rb')
  fileBytes=bytearray(fileInput.read())
  fileInput.close()
#  considerando qua a imagem ja esta alinhada em 4 k
#  fileBytes=fileBytes+bytearray(4096-len(fileBytes)%4096)

  # Cabecalho           = 0x0   - 0x1000
  # Copyright           = 0x0   - 0x4F
  # Plataforma          = 0x50  - 0x9F
  # Codigo da familia   = 0xA0  - 0xA5
  # Nome do arquivo     = 0xA8  - 0xF7
  # Data de criacao     = 0xF8  - 0x10A
  # Tag da release?     = 0x110 - 0x12F
  # ??????????????      = 0x130 - 0x131 # Valor igual nos 4 firmwares que comparei (0x8080)

  # Firmware bootavel?  = 0x404 - 0x407 # Se o valor for 0xFFFFFFFF o sistema mostra will NOT boot se for 0x4E415742 mostra will boot
                                        # Olhando o fwburn (funcao swap_fw_order), ele parece trocar o firmware ativo mudando o valor para 0xFFFFFFFF (nao ativo)
                                        # ou 0x4E415742 (ativo) ... e alterando o endereco que contem a ordem de boot??

  # Firmware bootavel?  = 0x408 - 0x40B # Valor igual em todos os firmwares, aparece ser utilizado na compacacao acima. sem eh 0x4E415742
  # Tamanho do arquivo  = 0x40C - 0x40F # 4k aligned
  # Ordem de boot       = 0x410 - 0x413 # fwburn parece ler e gravar aqui
  # Codigo do produto   = 0x414 - 0x417
  # Versao SVN          = 0x418 - 0x41B
  # Partition table      = 0x41c - (10 * 0x11c - 1) # Particoes contidas na imagem. 10, max. (entry_sz = 0x11c)
	# Name		= 0 - 0x3f
	# Image offset  = 0x40 - 0x43
	# Size		= 0x44 - 0x47
	# ?		= ...
  # MD5 Checksum        = 0xFF0 - 0x1000

  firmPlataform=readAsString(fileBytes, 30, 0x50)
  firmFileName=readAsString(fileBytes, 60, 0xA8)
  firmDate=readAsString(fileBytes, 20, 0xF8)
  firmFamilyCode=readAsString(fileBytes, 8, 0xA0)
  firmProductCode=readAsWord(fileBytes, 0x414)
  firmFileSize=readAsWord(fileBytes, 0x40C)
  firmSvnVer=readAsWord(fileBytes, 0x418)
  firmBootStatus=readAsWord(fileBytes, 0x404)
  firmBootOrder=readAsWord(fileBytes, 0x410)

  firmCheckSum=fileBytes[0xFF0:0x1000]
  hexCheckSum=''.join(format(x, '02x') for x in firmCheckSum)

  if(firmBootStatus == 1312905025):
    #0x404 == 0x4E415742
    bSt = 'will boot'
  else:
    bSt = 'will NOT boot'

  print("Plataform        : " + firmPlataform)
  print("Family code      : " + firmFamilyCode)
  print("Product code     : %X" % firmProductCode)
  print("Filename         : " + firmFileName)
  print("Date             : " + firmDate)
  print("Size             : %d" % firmFileSize)
  print("SVN version      : %d" % firmSvnVer)
  print("Boot status      : " + bSt)
  print("Boot order       : %d" % firmBootOrder)

  print("Partition Table")
  for i in range(10):
    print("  Part %d Name    : %s" % (i, readAsString(fileBytes, 0x40, 0x41c + 0x11c * i)))
    print("  Part %d Offset  : 0x%08X" % (i, readAsWord(fileBytes, 0x41c + 0x11c * i + 0x40)))
    print("  Part %d Size    : %d bytes" % (i, readAsWord(fileBytes, 0x41c + 0x11c * i + 0x44)))

  print("Checksum in file : " + hexCheckSum)
  print()
#  print("Checksum check 1 : " + hashlib.md5(fileBytes[:0xFF0]+fileBytes[0x1000:]).hexdigest())
#  print("Checksum check 2 : " + hashlib.md5(fileBytes).hexdigest())
#  print("Checksum check 3 : " + md5sum(fileInputName))

#  if(len(sys.argv)==3 and sys.argv[2]=="fixheader"):
  magicArray=[]
  try:
    magicArray=stupidMagicArray[readAsWord(fileBytes, 0x414)]
  except:
    print("Unknown Product code")
    exit()

  writeAsWord(0xFFFFFFFF, fileBytes, 0x404)     # Can be anything, but for md5 must be this
  writeAsWord(0x4E415742, fileBytes, 0x408)     # Unknown but has to be this or will trigger an corrupted firmware triger
  writeAsWord(0x00000000, fileBytes, 0x410)     # Can be anything, but for md5 must be this
  writeAsWord(len(fileBytes), fileBytes, 0x40C) # Set file size
#  writeAsWord(0x00000001, fileBytes, 0x418)     # Set svn revision

  MD5ofFile=hashlib.md5(fileBytes[:0xFF0]+fileBytes[0x1000:]).digest()

  for i in range(4):
    writeAsWord(magicArray[i]^readAsWord(MD5ofFile, i*4), fileBytes, 0xFF0+i*4)

  firmCheckSum=fileBytes[0xFF0:0x1000]
  hexCheckSum=''.join(format(x, '02x') for x in firmCheckSum)
  print("Checksum calc    : " + hexCheckSum)

#  print("Checksum try check : " + hashlib.md5(fileBytes[:0xFF0]+fileBytes[0x1000:]).hexdigest())
#  print("Checksum try check : " + hashlib.md5(fileBytes).hexdigest())
  fileOut=open(fileInputName[:-4]+"-fixed-header.bin", 'wb')
  fileOut.write(fileBytes)
  fileOut.close()

else :
  print("Use: firmInfo.py firmwareFile")

